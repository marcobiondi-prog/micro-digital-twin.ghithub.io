import { plantPhotoBounds, type PlantOutline } from "@/models/ar-plant-photo";

/** Browser-only mask: source pixels are preserved; nothing is generated. */
export async function extractPlantPhoto(source: string, outline: PlantOutline) {
  const bounds = plantPhotoBounds(outline);
  if (!bounds) return null;
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bounds.w * image.width));
  canvas.height = Math.max(1, Math.round(bounds.h * image.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.beginPath();
  outline.forEach((p, i) => {
    const x = (p.x - bounds.x) * image.width, y = (p.y - bounds.y) * image.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, -bounds.x * image.width, -bounds.y * image.height);
  return canvas;
}