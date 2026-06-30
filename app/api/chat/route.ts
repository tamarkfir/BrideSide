import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash";

// תקרת שימוש יומית להגנת מכסה/עלות באתר ציבורי. 0 = ללא הגבלה (ברירת מחדל בפיתוח).
// קובעים MAX_AI_CALLS_PER_DAY ב-env של הפריסה. הספירה בזיכרון: רכה (מתאפסת בקור-סטארט),
// אבל מספיקה כדי לבלום מבקר בודד מלשרוף את המכסה החינמית.
const DAILY_CAP = Number(process.env.MAX_AI_CALLS_PER_DAY ?? 0);
let capDay = "";
let capCount = 0;
function overDailyCap(): boolean {
  if (!DAILY_CAP) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (today !== capDay) {
    capDay = today;
    capCount = 0;
  }
  capCount += 1;
  return capCount > DAILY_CAP;
}

type ChatRequest = {
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
  json?: boolean;
  useSearch?: boolean;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
  }

  // הגנת מכסה/עלות: מעבר לתקרה היומית מחזירים "overloaded" → ה-UI נופל לדוגמת עיצוב
  if (overDailyCap()) {
    return NextResponse.json({ error: "overloaded" }, { status: 503 });
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "missing_messages" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const request = {
    model: MODEL,
    contents: body.messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: Math.min(body.maxTokens ?? 2048, 8192),
      // חיפוש: נותנים תקציב חשיבה כדי שהמודל באמת יזמן את כלי החיפוש על פני
      // פרומפט כבד ויחזיר grounding אמיתי. שאר הקריאות נשארות מהירות (budget 0).
      thinkingConfig: { thinkingBudget: body.useSearch && !body.json ? 512 : 0 },
      // googleSearch and responseMimeType (json mode) cannot be used together — conflict.
      ...(body.useSearch && !body.json ? { tools: [{ googleSearch: {} }] } : {}),
      ...(body.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  // המודל החינמי נוטה להחזיר 503/429 בעומס — ננסה שוב עם השהיה גוברת
  const MAX_ATTEMPTS = 4;
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent(request);
      const text = response.text ?? "";
      if (!text) {
        return NextResponse.json({ error: "empty_response" }, { status: 502 });
      }
      // אות אמיתי לחיפוש: כמה chunks הוחזרו ע"י googleSearch. המודל לבדו עלול
      // "להמציא" excerpt + source גם כש-grounding לא ירה — לכן מחזירים את הספירה
      // כדי שצד-הלקוח יוכל לפסול ציטוטים כשלא היה grounding אמיתי.
      const groundingCount =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0;
      return NextResponse.json({ text, grounded: groundingCount > 0, groundingCount });
    } catch (error) {
      lastError = error;
      const status = (error as { status?: number })?.status;
      const transient = status === 503 || status === 429 || status === 500;
      if (!transient || attempt === MAX_ATTEMPTS - 1) break;
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    }
  }

  console.error("Gemini API error:", lastError);
  const status = (lastError as { status?: number })?.status;
  if (status === 503 || status === 429) {
    return NextResponse.json({ error: "overloaded" }, { status: 503 });
  }
  return NextResponse.json({ error: "api_error" }, { status: 502 });
}
