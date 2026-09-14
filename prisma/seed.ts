import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'My HR Company',
      timezone: 'Asia/Dhaka',
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@hrplatform.local',
      passwordHash: 'hashed_password_placeholder', // We will skip real auth for local UI testing
      role: 'ADMIN',
      orgId: org.id,
    },
  })
  console.log('Database seeded with Org ID:', org.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })