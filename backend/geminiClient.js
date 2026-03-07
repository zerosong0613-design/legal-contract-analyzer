const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini 모델 인스턴스 반환
 * - gemini-1.5-pro : 긴 문서 분석에 적합 (최대 1M 토큰)
 */
function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
}

module.exports = { getModel };
