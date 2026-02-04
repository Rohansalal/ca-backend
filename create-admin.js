const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = 'admin123';
    const name = 'System Admin';
    const role = 'SUPER_ADMIN';

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
        where: { email }
    });

    if (existingAdmin) {
        console.log('Admin user already exists.');
        console.log(`Email: ${email}`);
        console.log('Use your existing password.');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role
        }
    });

    console.log('Admin user created successfully.');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
