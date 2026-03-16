import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/app/db/schema.ts",
    out: "./src/app/db/migrations",
});