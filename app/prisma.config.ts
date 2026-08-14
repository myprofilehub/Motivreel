import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 — datasource.url here is for CLI commands (migrate dev, etc.)
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
