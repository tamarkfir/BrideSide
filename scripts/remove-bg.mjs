/* ============================================================================
 *  הסרת רקע לבן מהאסטים (פרחים לחוצים + נייר קרוע) בתיקיית public/.
 *
 *  שיטה: flood-fill מהשוליים — מסיר רק את הלבן ה"מחובר" לרקע, כך שאזורים
 *  בהירים בתוך פרח נשמרים, והנייר (קרם/ורוד) נשמר כי הוא כהה מספיק מהלבן.
 *
 *  הרצה: npm run assets:cutout   (או: node scripts/remove-bg.mjs)
 *  כותב מעל הקבצים ב-public/. המקור נשמר ב-design/ ולא נגוע.
 * ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import pkg from "pngjs";
const { PNG } = pkg;

const ROOT = new URL("../public/", import.meta.url);

/** קבצים לעיבוד — פרחים + ניירות קרועים. (לא מעבדים paper-tile/spiral שהם בהירים כולם) */
const FILES = [
  "botanicals/daisy-cream.png",
  "botanicals/daisy-red.png",
  "botanicals/fern-sprig.png",
  "botanicals/fern-frond.png",
  "botanicals/fern-sprig2.png",
  "botanicals/flower-yellow.png",
  "botanicals/flower-cream.png",
  "botanicals/bouquet-purple.png",
  "botanicals/sprig-pink.png",
  "botanicals/sprig-pink2.png",
  "botanicals/hydrangea-ochre.png",
  "botanicals/petal-pink.png",
  "textures/paper-cream-torn.png",
  "textures/paper-blush-torn.png",
  "textures/paper-cream.png",
  "textures/paper-handwriting.png",
  "textures/paper-newsprint.png",
];

/** פיקסל "רקע" = בהיר מאוד וכמעט חסר צבע (לבן/אפור בהיר), לא נייר קרם/ורוד */
function isBackground(d, i, aggr = false) {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  const mn = Math.min(r, g, b);
  const mx = Math.max(r, g, b);
  // פרחים: סף אגרסיבי יותר כדי לתפוס הילה לבנבנה; ניירות: שמרני כדי לא לאכול קרם/ורוד
  return aggr ? mn >= 230 && mx - mn <= 24 : mn >= 244 && mx - mn <= 12;
}

function cutout(relPath) {
  const abs = new URL(relPath, ROOT);
  const aggr = relPath.includes("botanicals");
  const png = PNG.sync.read(readFileSync(abs));
  const { width: w, height: h, data: d } = png;
  const visited = new Uint8Array(w * h);
  const stack = [];

  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    if (!isBackground(d, p * 4, aggr)) return;
    visited[p] = 1;
    stack.push(p);
  };

  // זרעים: כל פיקסלי השוליים
  for (let x = 0; x < w; x++) {
    pushIf(x, 0);
    pushIf(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIf(0, y);
    pushIf(w - 1, y);
  }

  let removed = 0;
  while (stack.length) {
    const p = stack.pop();
    d[p * 4 + 3] = 0; // שקוף
    removed++;
    const x = p % w;
    const y = (p - x) / w;
    pushIf(x + 1, y);
    pushIf(x - 1, y);
    pushIf(x, y + 1);
    pushIf(x, y - 1);
  }

  // ניקוי הילה: שוחקים פיקסלים בהירים מאוד שנותרו וגובלים בשקוף
  // (במקום ריכוך אלפא שהשאיר טבעת לבנה למחצה סביב הפרח)
  const erodePasses = aggr ? 2 : 1;
  for (let pass = 0; pass < erodePasses; pass++) {
    const clear = [];
    for (let p = 0; p < w * h; p++) {
      if (d[p * 4 + 3] === 0) continue;
      const mn = Math.min(d[p * 4], d[p * 4 + 1], d[p * 4 + 2]);
      if (mn < 234) continue;
      const x = p % w;
      const y = (p - x) / w;
      const near = (xx, yy) =>
        xx >= 0 && yy >= 0 && xx < w && yy < h && d[(yy * w + xx) * 4 + 3] === 0;
      if (near(x + 1, y) || near(x - 1, y) || near(x, y + 1) || near(x, y - 1)) clear.push(p);
    }
    for (const p of clear) d[p * 4 + 3] = 0;
  }

  // חיתוך לגבולות התוכן — מסיר את השוליים השקופים כך שהתמונה = הפרח עצמו
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    writeFileSync(abs, PNG.sync.write(png));
    return `${relPath} — אזהרה: ריק לאחר הסרה`;
  }
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const dst = new PNG({ width: cw, height: ch });
  for (let y = 0; y < ch; y++) {
    const srcStart = ((minY + y) * w + minX) * 4;
    png.data.copy(dst.data, y * cw * 4, srcStart, srcStart + cw * 4);
  }

  writeFileSync(abs, PNG.sync.write(dst));
  const pct = ((removed / (w * h)) * 100).toFixed(0);
  return `${relPath} — רקע ${pct}%, חתוך ל-${cw}×${ch}`;
}

for (const f of FILES) {
  try {
    console.log("✓ " + cutout(f));
  } catch (e) {
    console.error("✗ " + f + " — " + e.message);
  }
}
console.log("\nסיום. הקבצים ב-public/ עודכנו עם רקע שקוף.");
