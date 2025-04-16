const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'dev@timeless.com' },
    update: {},
    create: {
      email: 'dev@timeless.com',
      name: 'Test User',
      password: await hash('password', 10),
      role: 'ARTIST',
    },
  });

  console.log('Test user created:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });