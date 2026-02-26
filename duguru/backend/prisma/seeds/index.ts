/**
 * backend/prisma/seeds/index.ts
 *
 * Ponto de entrada para todos os seeds.
 * Executar: npm run db:seed (tsx prisma/seeds/index.ts)
 */
import { PrismaClient } from "@prisma/client";
import { seedDailyQuotes } from "./dailyQuotes";
import { seedCompatibilityScores } from "./compatibilityScores";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeds do duGuru…\n");

  await seedDailyQuotes();
  await seedCompatibilityScores();

  console.log("\n✅ Todos os seeds concluídos.");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
