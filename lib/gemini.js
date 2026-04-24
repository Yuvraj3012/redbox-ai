import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-pro";

export async function askGemini(prompt, fallback) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const res = await model.generateContent(prompt);
    return res.response.text() || fallback;
  } catch {
    return fallback;
  }
}
