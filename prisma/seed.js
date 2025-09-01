import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Résultats pour le matchday 1 (comme ton seeder Laravel)
  await prisma.result.upsert({
    where: { matchday_matchId: { matchday: 1, matchId: 'MD1_ZWO_RAY' } },
    update: { team1Score: 2, team2Score: 1 },
    create: { matchday: 1, matchId: 'MD1_ZWO_RAY', team1Score: 2, team2Score: 1 }
  });

  await prisma.result.upsert({
    where: { matchday_matchId: { matchday: 1, matchId: 'MD1_FCB_VIS' } },
    update: { team1Score: 5, team2Score: 0 },
    create: { matchday: 1, matchId: 'MD1_FCB_VIS', team1Score: 5, team2Score: 0 }
  });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
