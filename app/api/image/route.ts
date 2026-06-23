import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-2.5-flash-image";

type ImageRequest = {
  prompt: string;
  /** אם מסופקת — מצב עריכה (תמונת קלט). אם לא — מצב יצירה (text→image) */
  imageBase64?: string;
  mimeType?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "missing_api_key" }, { status: 503 });
  }

  let body: ImageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: body.prompt },
    ];
    if (body.imageBase64) {
      parts.push({
        inlineData: { mimeType: body.mimeType ?? "image/png", data: body.imageBase64 },
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: parts,
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
    const data = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";

    if (!data) {
      return NextResponse.json({ error: "no_image" }, { status: 502 });
    }

    return NextResponse.json({ dataUrl: `data:${mimeType};base64,${data}` });
  } catch (error) {
    console.error("Gemini image error:", error);
    return NextResponse.json({ error: "api_error" }, { status: 502 });
  }
}
