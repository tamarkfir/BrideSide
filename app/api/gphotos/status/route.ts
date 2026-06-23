import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

/**
 * GET — בדיקת מצב סשן Picker.
 * Query params: sessionId, accessToken
 * מחזיר mediaItemsSet: boolean
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const token = url.searchParams.get("accessToken");

  if (!sessionId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    const res = await fetch(`${PICKER_BASE}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Picker session poll error:", res.status, text);
      return NextResponse.json(
        { error: "picker_poll_failed", detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      mediaItemsSet: data.mediaItemsSet === true,
    });
  } catch (error) {
    console.error("Picker poll error:", error);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
