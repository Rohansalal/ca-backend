const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'rohansalal@gmail.com' }
    });

    if (existingUser) {
      console.log('❌ User already exists with email: rohansalal@gmail.com');
      return;
    }

    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Rohan Salal',
        email: 'rohansalal@gmail.com',
        phone: '9876543210',
        password: '$2b$10$fgxXPyNoH1u01PLcOSjmn.OhuWF0pxxfm64.BRjph0Of7nhHjrYCe', // T@1234#rss hashed
        role: 'ADMIN',
        isEmailVerified: true,
        isPhoneVerified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: rohansalal@gmail.com');
    console.log('🔐 Password: T@1234#rss');
    console.log('👤 Name: Rohan Salal');
    console.log('📝 Role: ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Admin Login URL: http://localhost:3001/admin/login');
    console.log('📊 Dashboard URL: http://localhost:3001/admin/dashboard');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
