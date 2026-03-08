require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const os       = require("os");
const { spawn } = require("child_process");
const { analyzeContract } = require("./analyzeContract");

const app    = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));

// ── 계약서 분석 ─────────────────────────────────────────────
app.post("/api/analyze", upload.single("file"), async (req, res) => {
  try {
    const fileBuffer   = req.file?.buffer       || null;
    const mimetype     = req.file?.mimetype     || null;
    const originalname = req.file?.originalname || null;
    const text         = req.body?.text         || null;

    if (!fileBuffer && !text) {
      return res.status(400).json({ error: "파일 또는 텍스트를 전송해 주세요." });
    }

    const result = await analyzeContract({ fileBuffer, mimetype, originalname, text });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error("[analyzeContract error]", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Excel 보고서 내보내기 ────────────────────────────────────
app.post("/api/export", async (req, res) => {
  const { records } = req.body;

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: "records 배열이 필요합니다." });
  }

  // 임시 파일 경로
  const tmpFile = path.join(os.tmpdir(), `contractlens_${Date.now()}.xlsx`);
  const scriptPath = path.join(__dirname, "generate_report.py");

  try {
    await new Promise((resolve, reject) => {
      const py = spawn("python3", [
        scriptPath,
        JSON.stringify(records),
        tmpFile,
      ]);

      let stderr = "";
      py.stderr.on("data", (d) => { stderr += d.toString(); });
      py.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python error: ${stderr}`));
      });
    });

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = encodeURIComponent(`법무팀_계약성과관리_${today}.xlsx`);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);

    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on("end", () => {
      fs.unlink(tmpFile, () => {});
    });
  } catch (err) {
    console.error("[export error]", err);
    if (fs.existsSync(tmpFile)) fs.unlink(tmpFile, () => {});
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── 헬스체크 ────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅  Backend running on http://localhost:${PORT}`));
