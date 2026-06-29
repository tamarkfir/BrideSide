import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development mode" }, { status: 403 });
  }

  try {
    const layout = await request.json();
    const filePath = path.join(process.cwd(), "lib", "decorations.ts");
    
    // Read the current file content
    const content = await fs.readFile(filePath, "utf-8");
    
    // Convert the incoming layout to a formatted string
    const layoutString = JSON.stringify(layout, null, 2)
      // Clean up quotes around keys for a cleaner TS object look (optional, but nice)
      .replace(/"([^"]+)":/g, (match, p1) => {
        // Only remove quotes if the key is a valid JS identifier (no spaces or special chars)
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p1)) {
          return `${p1}:`;
        }
        return match; // keep quotes for keys like "מסורת וחתונה"
      });

    // We want to replace the existing DEFAULT_DECOR object.
    // We use a robust regex that assumes `};` marks the end of the JSON object.
    // Since it's JSON, there won't be any other `};` inside it.
    const regex = /(export const DEFAULT_DECOR:\s*DecoLayout\s*=\s*)\{[\s\S]*?\};/;
    
    const newContent = content.replace(regex, (match, prefix) => {
      return `${prefix}${layoutString};`;
    });

    if (newContent === content) {
      // It's not an error if there's no change (the string matches exactly)
      return NextResponse.json({ success: true, unchanged: true });
    }

    await fs.writeFile(filePath, newContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save decor:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
