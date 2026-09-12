import "dotenv/config";
import { defineConfig } from "prisma/config";

const dbUrl =
  process.env["DATABASE_URL"] ||
  (process.env["VERCEL"] ? "file:/tmp/dev.db" : "file:./dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
