import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

/**
 * POST — יצירת סשן חדש ב-Picker API.
 * מקבל access token מהלקוח (שהתקבל דרך Google OAuth).
 * מחזיר sessionId + pickerUri.
 */
export async function POST(req: Request) {
  let body: { accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token = body.accessToken;
  if (!token) {
    return NextResponse.json({ error: "missing_access_token" }, { status: 400 });
  }

  try {
    const res = await fetch(`${PICKER_BASE}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Picker session create error:", res.status, text);
      return NextResponse.json(
        { error: "picker_session_failed", detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      sessionId: data.id,
      pickerUri: data.pickerUri,
    });
  } catch (error) {
    console.error("Picker session error:", error);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
