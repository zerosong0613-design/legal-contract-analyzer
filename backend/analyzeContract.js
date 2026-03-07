const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const { getModel } = require("./geminiClient");

const PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../prompts/contractAnalysisPrompt.md"),
  "utf-8"
);

async function analyzeContract({ fileBuffer, mimetype, text }) {
  let contractText = text || "";

  if (fileBuffer) {
    const isPdf = mimetype === "application/pdf";
    const isWord =
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimetype === "application/msword";

    if (isPdf) {
      const parsed = await pdf(fileBuffer);
      contractText = parsed.text;
    } else if (isWord) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      contractText = result.value;
    } else {
      throw new Error("지원하지 않는 파일 형식입니다. PDF 또는 Word(.doc/.docx)만 가능합니다.");
    }
  }

  if (!contractText.trim()) throw new Error("계약서 내용이 비어 있습니다.");

  const prompt = `${PROMPT_TEMPLATE}\n\n---\n\n[계약서 본문]\n${contractText}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  const match = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("Gemini 응답에서 JSON을 파싱할 수 없습니다.");

  return JSON.parse(match[1] || match[0]);
}

module.exports = { analyzeContract };
