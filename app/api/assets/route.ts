import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ assets: [] });
  }

  try {
    const publicDir = path.join(process.cwd(), "public");
    const botanicalsDir = path.join(publicDir, "botanicals");
    const texturesDir = path.join(publicDir, "textures");

    const getFiles = async (dir: string, prefix: string) => {
      try {
        const files = await fs.readdir(dir);
        return files
          .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg') || f.endsWith('.jpeg'))
          .map(f => `${prefix}/${f}`);
      } catch (e) {
        return [];
      }
    };

    const botanicals = await getFiles(botanicalsDir, "/botanicals");
    const textures = await getFiles(texturesDir, "/textures");

    return NextResponse.json({ assets: [...botanicals, ...textures] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
