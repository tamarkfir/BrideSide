/**
 * Google Photos Picker — לקוח צד-לקוח.
 * מתזמר את כל הזרימה: OAuth → סשן Picker → חלון בחירה → שליפת תמונות.
 */

/* ============ Google Identity Services (GIS) types ============ */

type TokenResponse = {
  access_token: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken: () => void;
  callback: (response: TokenResponse) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

/* ============ Public API ============ */

export type GPhotosResult =
  | { ok: true; photos: string[] }
  | { ok: false; error: string };

const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

/**
 * הפעלת זרימת Google Photos Picker מלאה.
 * מחזירה מערך data URLs של תמונות שנבחרו, או שגיאה.
 */
export async function runGooglePhotosPicker(): Promise<GPhotosResult> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return { ok: false, error: "missing_client_id" };
  }

  // שלב 1: OAuth — קבלת access token
  const token = await getAccessToken(clientId);
  if (!token) {
    return { ok: false, error: "auth_cancelled" };
  }

  try {
    // שלב 2: יצירת סשן Picker
    const sessionRes = await fetch("/api/gphotos/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token }),
    });
    if (!sessionRes.ok) {
      return { ok: false, error: "session_failed" };
    }
    const { sessionId, pickerUri } = await sessionRes.json();

    // שלב 3: פתיחת חלון הבחירה
    const pickerWindow = window.open(
      `${pickerUri}/autoclose`,
      "gphotos_picker",
      "width=900,height=700,left=200,top=100"
    );

    // שלב 4: המתנה לסיום בחירה — polling
    const selected = await pollUntilSelected(token, sessionId, pickerWindow);
    if (!selected) {
      return { ok: false, error: "selection_timeout" };
    }

    // שלב 5: שליפת התמונות
    const itemsRes = await fetch(
      `/api/gphotos/items?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(token)}`
    );
    if (!itemsRes.ok) {
      return { ok: false, error: "fetch_failed" };
    }
    const { photos } = await itemsRes.json();

    // שלב 6: ניקוי סשן (best-effort)
    void fetch(
      `/api/gphotos/items?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(token)}`,
      { method: "DELETE" }
    );

    return { ok: true, photos: photos ?? [] };
  } catch {
    return { ok: false, error: "unexpected_error" };
  }
}

/* ============ Internal helpers ============ */

/** בקשת access token דרך Google Identity Services */
function getAccessToken(clientId: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!window.google?.accounts?.oauth2) {
      resolve(null);
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error || !response.access_token) {
          resolve(null);
        } else {
          resolve(response.access_token);
        }
      },
    });

    client.requestAccessToken();
  });
}

/**
 * Polling — בודק כל 2 שניות אם המשתמשת סיימה לבחור.
 * עוצר גם אם החלון נסגר ידנית (timeout אחרי סגירה + 3 ניסיונות).
 */
async function pollUntilSelected(
  token: string,
  sessionId: string,
  pickerWindow: Window | null
): Promise<boolean> {
  const MAX_POLLS = 150; // עד 5 דקות (150 × 2s)
  let closedPolls = 0;

  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(2000);

    try {
      const res = await fetch(
        `/api/gphotos/status?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(token)}`
      );
      if (res.ok) {
        const { mediaItemsSet } = await res.json();
        if (mediaItemsSet) return true;
      }
    } catch {
      // שגיאת רשת — ממשיכים לנסות
    }

    // אם החלון נסגר בלי שהתקבל mediaItemsSet — ממתינים עוד 3 ניסיונות
    if (pickerWindow?.closed) {
      closedPolls++;
      if (closedPolls > 3) return false;
    }
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
