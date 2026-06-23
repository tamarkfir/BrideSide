import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: key });

async function test1() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "what are the lyrics to hallelujah? output JSON.",
      tools: [{ googleSearch: {} }],
      config: {
        responseMimeType: "application/json"
      }
    });
    console.log("TEST 1 SUCCESS");
  } catch (e) {
    console.error("TEST 1 ERROR:", e.message);
  }
}
test1();
