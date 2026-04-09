import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

export async function ensureUploadDir() {
  await fs.mkdir(env.uploadDir, { recursive: true });
}

export async function saveUploadedFile(file: File) {
  await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const outputPath = path.join(env.uploadDir, safeName);

  await fs.writeFile(outputPath, Buffer.from(bytes));

  return {
    fileName: file.name,
    filePath: outputPath,
    mimeType: file.type || "application/octet-stream",
  };
}
