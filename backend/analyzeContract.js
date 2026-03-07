const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { getModel } = require("./geminiClient");

// 프롬프트 로드
const PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../prompts/contractAnalysisPrompt.md"),
  "utf-8"
);

/**
 * 파일(PDF) 또는 텍스트를 받아 Gemini로 계약서 분석 후 JSON 반환
 * @param {Object} options
 * @param {Buffer} [options.fileBuffer] - PDF 파일 버퍼
 * @param {string} [options.text]       - 직접 붙여넣은 텍스트
 * @returns {Promise<Object>} 분석 결과 JSON
 */
async function analyzeContract({ fileBuffer, text }) {
  let contractText = text || "";

  // PDF → 텍스트 추출
  if (fileBuffer) {
    const parsed = await pdf(fileBuffer);
    contractText = parsed.text;
  }

  if (!contractText.trim()) {
    throw new Error("계약서 내용이 비어 있습니다.");
  }

  const prompt = `${PROMPT_TEMPLATE}\n\n---\n\n[계약서 본문]\n${contractText}`;

  const model = getModel();
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
  const match = rawText.match(/```json\s*([\s\S]*?)```/) || rawText.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error("Gemini 응답에서 JSON을 파싱할 수 없습니다.");

  return JSON.parse(match[1] || match[0]);
}

module.exports = { analyzeContract };
