import path from "node:path";

export const env = {
  appEnv: process.env.APP_ENV ?? "local",
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? "",
  nextAuthUrl: process.env.NEXTAUTH_URL ?? "http://localhost:9000",
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads"),
  mailEnabled: process.env.MAIL_ENABLED === "true",
};
