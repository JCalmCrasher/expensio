"use client";

const MAX_IMAGE_SIDE = 1600;

async function prepareImageForOcr(file: File): Promise<File | Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Image is too large. Try a smaller photo.");
  }
  if (typeof createImageBitmap !== "function" || file.size <= 1_500_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_IMAGE_SIDE) {
    bitmap.close();
    return file;
  }

  const scale = MAX_IMAGE_SIDE / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.88);
  });
  if (!blob) return file;
  return blob;
}

/** Run Tesseract in the browser (no backend). First run may download language data. */
export async function runReceiptOcr(file: File): Promise<string> {
  const image = await prepareImageForOcr(file);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}
