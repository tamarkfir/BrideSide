import { NextResponse } from "next/server";

export const runtime = "nodejs";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/** שולף טוקן גישה מ-Spotify (Client Credentials Flow) */
async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials in .env.local");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Failed to get Spotify token: ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // נשמור קצת פחות מ-3600 שניות כדי להיות בטוחים
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  
  return cachedToken;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const token = await getSpotifyToken();

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Spotify API error:", res.status, text);
      return NextResponse.json({ error: "spotify_api_error" }, { status: 502 });
    }

    const data = await res.json();
    const tracks = data.tracks?.items || [];

    const results = tracks.map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a: any) => a.name).join(", "),
      image: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url, // Smallest image usually at index 2
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Spotify API failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
