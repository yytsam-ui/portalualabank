import path from "node:path";

const defaultUploadDir =
  process.env.UPLOAD_DIR ??
  (process.env.VERCEL ? "/tmp/portal-uala-bank-uploads" : "./storage/uploads");

export const env = {
  appEnv: process.env.APP_ENV ?? "local",
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:9000",
  uploadDir: path.isAbsolute(defaultUploadDir)
    ? defaultUploadDir
    : path.resolve(process.cwd(), defaultUploadDir),
  mailEnabled: process.env.MAIL_ENABLED === "true",
};
