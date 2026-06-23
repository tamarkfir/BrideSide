import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

/** גודל מקסימלי לייבוא — מתאים ל-resizeImage ב-photoStore (maxDim=900) */
const PHOTO_SIZE = "=w900-h900";

/**
 * GET — שליפת התמונות שהמשתמשת בחרה.
 * Query params: sessionId, accessToken
 * מחזיר מערך של data URLs.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const token = url.searchParams.get("accessToken");

  if (!sessionId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    // שלב 1: רשימת הפריטים שנבחרו
    const listRes = await fetch(
      `${PICKER_BASE}/mediaItems?sessionId=${encodeURIComponent(sessionId)}&pageSize=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      console.error("Picker list error:", listRes.status, text);
      return NextResponse.json(
        { error: "picker_list_failed", detail: text },
        { status: listRes.status }
      );
    }

    const listData = await listRes.json();
    const items: Array<{ id: string; baseUrl: string; mimeType: string }> =
      listData.mediaItems ?? [];

    // סינון — רק תמונות, לא סרטונים
    const imageItems = items.filter(
      (item) => item.mimeType?.startsWith("image/") && item.baseUrl
    );

    // שלב 2: הורדת כל תמונה והמרה ל-base64
    const dataUrls: string[] = [];
    for (const item of imageItems) {
      try {
        const imgRes = await fetch(`${item.baseUrl}${PHOTO_SIZE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!imgRes.ok) continue;

        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mime = imgRes.headers.get("content-type") ?? item.mimeType ?? "image/jpeg";
        dataUrls.push(`data:${mime};base64,${base64}`);
      } catch {
        // תמונה בודדת שנכשלה — מדלגים
      }
    }

    return NextResponse.json({ photos: dataUrls, total: imageItems.length });
  } catch (error) {
    console.error("Picker items error:", error);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}

/**
 * DELETE — ניקוי סשן Picker לאחר ייבוא.
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const token = url.searchParams.get("accessToken");

  if (!sessionId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    await fetch(`${PICKER_BASE}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // ניקוי הוא best-effort
  }
}
