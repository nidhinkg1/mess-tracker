import { PrismaClient, MealExceptionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Checking seed users...');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create or update Main User (nidhinkg100@gmail.com)
  const user1 = await prisma.user.upsert({
    where: { email: 'nidhinkg100@gmail.com' },
    update: {
      passwordHash: defaultPasswordHash
    },
    create: {
      name: 'Nidhin KG',
      email: 'nidhinkg100@gmail.com',
      passwordHash: defaultPasswordHash
    }
  });
  console.log(`✅ Seed user updated/created: ${user1.email} (Password: password123)`);

  // 2. Create or update Demo User (resident@example.com)
  const user2 = await prisma.user.upsert({
    where: { email: 'resident@example.com' },
    update: {
      passwordHash: defaultPasswordHash
    },
    create: {
      name: 'Demo Resident',
      email: 'resident@example.com',
      passwordHash: defaultPasswordHash
    }
  });
  console.log(`✅ Seed user updated/created: ${user2.email} (Password: password123)`);

  // Ensure default payments exist for user1 if empty
  const paymentsCount1 = await prisma.advancePayment.count({ where: { userId: user1.id } });
  if (paymentsCount1 === 0) {
    await prisma.advancePayment.create({
      data: {
        userId: user1.id,
        amount: 3000,
        paymentDate: new Date('2026-08-01T00:00:00.000Z'),
        note: 'August Advance Payment'
      }
    });
  }

  // Ensure default exceptions exist for user1 if empty
  const exceptionsCount1 = await prisma.mealException.count({ where: { userId: user1.id } });
  if (exceptionsCount1 === 0) {
    const defaultExceptions = [
      { date: new Date('2026-08-10T00:00:00.000Z'), type: MealExceptionType.DINNER_ONLY },
      { date: new Date('2026-08-11T00:00:00.000Z'), type: MealExceptionType.NO_FOOD },
      { date: new Date('2026-08-12T00:00:00.000Z'), type: MealExceptionType.LUNCH_ONLY }
    ];

    for (const exc of defaultExceptions) {
      await prisma.mealException.create({
        data: { userId: user1.id, date: exc.date, type: exc.type }
      });
    }
  }

  console.log('🎉 Seed check completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
