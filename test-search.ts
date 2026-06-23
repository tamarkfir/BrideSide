import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Search the web for the exact lyrics of 'Hallelujah' by Leonard Cohen. Return it in JSON format.",
      tools: [{ googleSearch: {} }]
    });
    console.log(response.text);
    console.log("Search metadata:", response.candidates?.[0]?.groundingMetadata ? "YES" : "NO");
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
