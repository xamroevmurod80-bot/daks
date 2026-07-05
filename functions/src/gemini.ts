import { GoogleGenerativeAI } from "@google/generative-ai";

const ANALYSIS_PROMPT = `Ты эксперт по контролю качества звонков колл-центра DaksDrive (аренда самокатов и мопедов).
Прослушай запись разговора оператора с клиентом.
Оцени: соответствие скрипту, тон и вежливость, решение проблемы, профессионализм, удержание клиента.
Ответь ТОЛЬКО валидным JSON без markdown и без пояснений:
{"score":<число 0-100>,"feedback":"<детальный разбор на русском, 3-5 предложений>","status":"pass"|"fail"}
status = "pass" если score >= 85, иначе "fail".`;

export type GeminiAnalysis = {
  score: number;
  feedback: string;
  status: "pass" | "fail";
};

export async function analyzeCallAudio(
  apiKey: string,
  audioBase64: string,
  mimeType: string,
): Promise<GeminiAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    { text: ANALYSIS_PROMPT },
    { inlineData: { mimeType, data: audioBase64 } },
  ]);

  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini не вернул JSON. Попробуйте другой файл.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<GeminiAnalysis>;
  const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)));
  const feedback = String(parsed.feedback ?? "").trim();
  if (!feedback) throw new Error("Пустой ответ от Gemini");

  const status: "pass" | "fail" = score >= 85 ? "pass" : "fail";
  return { score, feedback, status };
}
