const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const { openai } = require("./openaiClient");

const PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../prompts/contractAnalysisPrompt.md"),
  "utf-8"
);

function isWordFile(mimetype, originalname) {
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) return true;
  // 확장자로 추가 체크 (브라우저 MIME 오인식 대응)
  if (originalname) {
    const ext = originalname.toLowerCase();
    if (ext.endsWith(".docx") || ext.endsWith(".doc")) return true;
  }
  return false;
}

async function analyzeContract({ fileBuffer, mimetype, originalname, text }) {
  let contractText = text || "";

  if (fileBuffer) {
    const isPdf = mimetype === "application/pdf" ||
      (originalname && originalname.toLowerCase().endsWith(".pdf"));

    if (isPdf) {
      const parsed = await pdf(fileBuffer);
      contractText = parsed.text;
    } else if (isWordFile(mimetype, originalname)) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      contractText = result.value;
    } else {
      throw new Error("지원하지 않는 파일 형식입니다. PDF 또는 Word(.doc/.docx)만 가능합니다.");
    }
  }

  if (!contractText.trim()) throw new Error("계약서 내용이 비어 있습니다.");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      { role: "system", content: PROMPT_TEMPLATE },
      { role: "user", content: `다음 계약서를 분석해주세요:\n\n${contractText}` },
    ],
  });

  const rawText = response.choices[0].message.content || "";
  const match = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("응답에서 JSON을 파싱할 수 없습니다.");

  return JSON.parse(match[1] || match[0]);
}

module.exports = { analyzeContract };
