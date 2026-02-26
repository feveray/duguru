import "dotenv/config";
import { createApp } from "./app";

const PORT = Number(process.env["PORT"] ?? 3000);

async function main() {
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`[duGuru API] Server running on http://localhost:${PORT}`);
    console.log(`[duGuru API] Environment: ${process.env["NODE_ENV"] ?? "development"}`);
  });
}

main().catch((err: unknown) => {
  console.error("[duGuru API] Fatal startup error:", err);
  process.exit(1);
});
