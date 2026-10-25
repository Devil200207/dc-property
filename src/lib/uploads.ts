import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "./db";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Stored files are always `<32 hex>.webp` (+ `-t.webp` thumbnail) or `<32 hex>.pdf`. */
export const KEY_RE = /^[a-f0-9]{32}(-t)?\.(webp|pdf)$/;

export type Purpose = "photo" | "map";

export async function saveUpload(file: File, purpose: Purpose): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 20 MB");
  const id = crypto.randomBytes(16).toString("hex");
  const buf = Buffer.from(await file.arrayBuffer());

  if (purpose === "map" && (file.type === "application/pdf" || buf.subarray(0, 5).toString() === "%PDF-")) {
    await fs.writeFile(path.join(UPLOAD_DIR, `${id}.pdf`), buf);
    return `${id}.pdf`;
  }

  // Normalise every image to WebP: auto-rotate (phone EXIF), strip metadata (GPS etc.), cap size.
  const max = purpose === "map" ? 2400 : 1600;
  let img: ReturnType<typeof sharp>;
  try {
    img = sharp(buf, { failOn: "none" }).rotate();
    await img.metadata();
  } catch {
    throw new Error("Unsupported image. Please upload JPG, PNG or WebP (or PDF for khasra maps).");
  }
  await Promise.all([
    img.clone().resize(max, max, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: purpose === "map" ? 85 : 78 })
      .toFile(path.join(UPLOAD_DIR, `${id}.webp`)),
    img.clone().resize(640, 480, { fit: "cover", position: "attention" })
      .webp({ quality: 70 })
      .toFile(path.join(UPLOAD_DIR, `${id}-t.webp`)),
  ]);
  return `${id}.webp`;
}

export async function deleteUploads(keys: (string | null | undefined)[]) {
  const files = keys
    .filter((k): k is string => !!k && KEY_RE.test(k))
    .flatMap((k) => (k.endsWith(".webp") ? [k, k.replace(/\.webp$/, "-t.webp")] : [k]));
  await Promise.all(files.map((f) => fs.rm(path.join(UPLOAD_DIR, f), { force: true })));
}
