import type { Message } from "./types";

export type AIResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * קריאה למנחה דרך ה-API route.
 * history — הודעות קודמות לרצף שיחה; prompt — ההודעה הנוכחית.
 */
export async function askAI(
  prompt: string,
  history: Message[] = [],
  maxTokens = 1024,
  json = false
): Promise<AIResult> {
  try {
    const messages: Message[] = [...history, { role: "user", content: prompt }];
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, maxTokens, json }),
    });

    const data = await res.json();
    if (!res.ok || typeof data.text !== "string") {
      return { ok: false, error: data.error ?? "request_failed" };
    }
    return { ok: true, text: data.text };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

/** חילוץ JSON מתשובת המודל — סלחני לטקסט עוטף או לגדרות markdown */
export function extractJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

export async function askAIJson<T>(prompt: string, history: Message[] = [], maxTokens = 2048): Promise<T | null> {
  const result = await askAI(prompt, history, maxTokens, true);
  if (!result.ok) return null;
  return extractJson<T>(result.text);
}

/**
 * יצירת/עריכת תמונה דרך ה-API route.
 * בלי imageBase64 — יצירה (text→image, לאיורים).
 * עם imageBase64 — עריכה (הסרת רקע / סגנון לתמונה קיימת).
 * מחזירה data URL מוכן לתצוגה, או null אם נכשל / אין מפתח.
 */
export async function askAIImage(params: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || typeof data.dataUrl !== "string") return null;
    return data.dataUrl;
  } catch {
    return null;
  }
}

/** פיצול data URL ל-base64 + mimeType עבור עריכת תמונה */
export function splitDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}
