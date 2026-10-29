import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Find the main org, OR create it if the DB is completely empty
  let org = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' } 
  });

  if (!org) {
    console.log("Fresh database detected! Creating master organization...");
    org = await prisma.organization.create({
      data: { name: 'FAL Enterprise' }
    });
  } else {
    console.log(`Found existing organization: ${org.name}`);
  }

  // 2. Find or create the Super Admin role
  let role = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'Super Admin' } });
  }

  // 3. Find or create the Admin Employee
  let employee = await prisma.employee.findUnique({ where: { email: 'admin@fal.com' } });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        orgId: org.id,
        employeeCode: 'FAL-0001', 
        name: 'System Admin',
        email: 'admin@fal.com', 
        phone: '+8801700000000', 
        position: 'Super Admin',
        department: 'Management', 
        joiningDate: new Date(),
        status: 'ACTIVE'
      }
    });
  } else if (employee.orgId !== org.id) {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: { orgId: org.id }
    });
  }

  // 4. Find, create, or update the User Login
  const hashedPassword = await bcrypt.hash('admin123', 10);
  let user = await prisma.user.findUnique({ where: { email: 'admin@fal.com' } });
  
  if (!user) {
    await prisma.user.create({
      data: {
        email: 'admin@fal.com', 
        passwordHash: hashedPassword,
        orgId: org.id, 
        roleId: role.id, 
        employeeId: employee.id
      }
    });
  } else {
    await prisma.user.update({
      where: { email: 'admin@fal.com' },
      data: { orgId: org.id, roleId: role.id, employeeId: employee.id, passwordHash: hashedPassword }
    });
  }

  console.log("Success! Master Admin account is ready: admin@fal.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());