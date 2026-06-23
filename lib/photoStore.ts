/**
 * מאגר תמונות זמני בין דף הנחיתה לספר.
 * חי בזיכרון המודול — שורד ניווט client-side (router.push),
 * ומתרוקן בקריאה הראשונה כדי שהחלוקה לעמודים תקרה פעם אחת.
 */

let pool: string[] = [];

export function setPhotoPool(dataUrls: string[]): void {
  pool = dataUrls;
}

export function takePhotoPool(): string[] {
  const taken = pool;
  pool = [];
  return taken;
}

/** הקטנת תמונה בצד הלקוח לפני שמירה ל-state — חוסך זיכרון */
export function resizeImage(file: File, maxDim = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode_failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
