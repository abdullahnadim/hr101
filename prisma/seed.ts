import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create the organization
  const org = await prisma.organization.create({
    data: {
      name: 'Fashion Asia Limited', // Updated to FAL
      timezone: 'Asia/Dhaka',
    },
  });

  // 2. Cryptographically hash the password "admin123"
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 3. Create or update the Admin user with the real hash
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fal.com' },
    update: {}, // Do nothing if the user already exists
    create: {
      email: 'admin@fal.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      orgId: org.id,
    },
  });

  console.log('✅ Database seeded!');
  console.log(`🏢 Organization ID: ${org.id}`);
  console.log(`👤 Admin Email: ${admin.email}`);
  console.log(`🔑 Password: admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });