import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  const username = 'admin';
  const password = 'admin123';
  const email = `${username}@admin.local`;

  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log(`User "${username}" already exists. Updating password...`);

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { username },
        data: {
          password: hashedPassword,
          role: 'admin',
        },
      });

      console.log(`✅ Admin user "${username}" password updated successfully!`);
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Email: ${email}`);
    console.log(`ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
