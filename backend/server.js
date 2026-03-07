require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { analyzeContract } = require("./analyzeContract");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.post("/api/analyze", upload.single("file"), async (req, res) => {
  try {
    const fileBuffer = req.file?.buffer || null;
    const mimetype = req.file?.mimetype || null;
    const text = req.body?.text || null;

    if (!fileBuffer && !text) {
      return res.status(400).json({ error: "파일 또는 텍스트를 전송해 주세요." });
    }

    const result = await analyzeContract({ fileBuffer, mimetype, text });
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error("[analyzeContract error]", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅  Backend running on http://localhost:${PORT}`));
