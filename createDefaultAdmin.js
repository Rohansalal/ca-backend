const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * ==============================================
 * SECURE ADMIN ACCOUNT CREATOR
 * ==============================================
 * Creates default admin account for system access
 * Uses bcrypt for secure password hashing
 * 
 * Default Admin Credentials:
 * Email: admin@example.com
 * Password: Admin@12345
 * 
 * Security Features:
 * - Bcrypt hash with 12 rounds (production-grade)
 * - Checks for existing admin before creating
 * - Option to create SUPER_ADMIN
 * - Automatic email verification
 * - Safe error handling
 */

async function createDefaultAdmin() {
    try {
        console.log('═══════════════════════════════════════════════');
        console.log('  SECURE ADMIN ACCOUNT CREATOR');
        console.log('═══════════════════════════════════════════════\n');

        // Default admin credentials
        const ADMIN_EMAIL = 'admin@example.com';
        const ADMIN_PASSWORD = 'Admin@12345';
        const ADMIN_NAME = 'System Administrator';
        const ADMIN_PHONE = '+91 9999999999';

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin account already exists!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📧 Email: ${existingAdmin.email}`);
            console.log(`👤 Name: ${existingAdmin.name}`);
            console.log(`🔐 Role: ${existingAdmin.role}`);
            console.log(`📅 Created: ${existingAdmin.createdAt.toLocaleString()}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // Ask if we should update password
            console.log('💡 To reset password, delete the user and run this script again.');
            console.log('   Or manually update the password hash in the database.\n');

            return;
        }

        // Hash password with bcrypt (12 rounds for production)
        console.log('🔐 Hashing password securely (this may take a moment)...');
        const saltRounds = 12; // Production-grade security
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
        console.log('✅ Password hashed successfully\n');

        // Create admin user
        console.log('👤 Creating admin account...');
        const admin = await prisma.user.create({
            data: {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                phone: ADMIN_PHONE,
                password: hashedPassword,
                role: 'ADMIN', // Change to 'SUPER_ADMIN' if needed
                isEmailVerified: true,
                isPhoneVerified: true
            }
        });

        console.log('✅ Admin account created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  ADMIN CREDENTIALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:    ${ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
        console.log(`👤 Name:     ${ADMIN_NAME}`);
        console.log(`📝 Role:     ${admin.role}`);
        console.log(`🆔 User ID:  ${admin.id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🌐 Admin Login URLs:');
        console.log('   Local:      http://localhost:5173/admin/login');
        console.log('   API Login:  POST http://localhost:5000/api/admin/login\n');

        console.log('📋 API Test Command (PowerShell):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('$body = @{');
        console.log(`    email = "${ADMIN_EMAIL}"`);
        console.log(`    password = "${ADMIN_PASSWORD}"`);
        console.log('} | ConvertTo-Json\n');
        console.log('Invoke-WebRequest -Uri "http://localhost:5000/api/admin/login" `');
        console.log('  -Method POST `');
        console.log('  -ContentType "application/json" `');
        console.log('  -Body $body\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  SECURITY NOTES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  IMPORTANT:');
        console.log('1. Change this password immediately in production');
        console.log('2. Use a strong, unique password');
        console.log('3. Enable two-factor authentication if available');
        console.log('4. Never share admin credentials');
        console.log('5. Use separate admin JWT secret (ADMIN_JWT_SECRET)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Setup complete! You can now login to the admin panel.\n');

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        console.error('\nFull error details:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Also create a super admin function
async function createSuperAdmin() {
    try {
        console.log('═══════════════════════════════════════════════');
        console.log('  SUPER ADMIN ACCOUNT CREATOR');
        console.log('═══════════════════════════════════════════════\n');

        const SUPER_ADMIN_EMAIL = 'superadmin@example.com';
        const SUPER_ADMIN_PASSWORD = 'SuperAdmin@12345';
        const SUPER_ADMIN_NAME = 'Super Administrator';

        const existingSuperAdmin = await prisma.user.findUnique({
            where: { email: SUPER_ADMIN_EMAIL }
        });

        if (existingSuperAdmin) {
            console.log('⚠️  Super Admin account already exists!');
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Role: ${existingSuperAdmin.role}\n`);
            return;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, saltRounds);

        const superAdmin = await prisma.user.create({
            data: {
                name: SUPER_ADMIN_NAME,
                email: SUPER_ADMIN_EMAIL,
                phone: '+91 8888888888',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                isEmailVerified: true,
                isPhoneVerified: true
            }
        });

        console.log('✅ Super Admin account created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:    ${SUPER_ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
        console.log(`👤 Name:     ${SUPER_ADMIN_NAME}`);
        console.log(`📝 Role:     SUPER_ADMIN`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--super')) {
    createSuperAdmin();
} else if (args.includes('--both')) {
    (async () => {
        await createDefaultAdmin();
        await createSuperAdmin();
    })();
} else {
    createDefaultAdmin();
}
