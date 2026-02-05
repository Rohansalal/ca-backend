const { PrismaClient } = require('@prisma/client');
const logger = require('../src/utils/logger');

/**
 * Data Migration Script: SQLite → PostgreSQL
 * Migrates all data from SQLite to PostgreSQL database
 * Run this after schema migration is complete
 */

async function migrateData() {
    console.log('🚀 Starting data migration...\n');

    // SQLite client (read from backup)
    const sqliteDB = new PrismaClient({
        datasources: {
            db: {
                url: 'file:./prisma/dev.db'
            }
        }
    });

    // PostgreSQL client (write to production)
    const postgresDB = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        // Test connections
        await sqliteDB.$connect();
        await postgresDB.$connect();
        console.log('✅ Database connections established\n');

        // Migrate in order (respecting foreign key constraints)

        // 1. Service Categories
        console.log('📦 Migrating Service Categories...');
        const categories = await sqliteDB.serviceCategory.findMany();
        for (const cat of categories) {
            await postgresDB.serviceCategory.upsert({
                where: { id: cat.id },
                create: cat,
                update: cat
            });
        }
        console.log(`✅ Migrated ${categories.length} service categories\n`);

        // 2. Services
        console.log('📦 Migrating Services...');
        const services = await sqliteDB.service.findMany();
        for (const service of services) {
            await postgresDB.service.upsert({
                where: { id: service.id },
                create: service,
                update: service
            });
        }
        console.log(`✅ Migrated ${services.length} services\n`);

        // 3. Service Plans
        console.log('📦 Migrating Service Plans...');
        const plans = await sqliteDB.servicePlan.findMany();
        for (const plan of plans) {
            await postgresDB.servicePlan.upsert({
                where: { id: plan.id },
                create: plan,
                update: plan
            });
        }
        console.log(`✅ Migrated ${plans.length} service plans\n`);

        // 4. Users
        console.log('📦 Migrating Users...');
        const users = await sqliteDB.user.findMany();
        for (const user of users) {
            await postgresDB.user.upsert({
                where: { email: user.email },
                create: user,
                update: user
            });
        }
        console.log(`✅ Migrated ${users.length} users\n`);

        // 5. Admins
        console.log('📦 Migrating Admins...');
        const admins = await sqliteDB.admin.findMany();
        for (const admin of admins) {
            await postgresDB.admin.upsert({
                where: { email: admin.email },
                create: admin,
                update: admin
            });
        }
        console.log(`✅ Migrated ${admins.length} admins\n`);

        // 6. User Services
        console.log('📦 Migrating User Services...');
        const userServices = await sqliteDB.userService.findMany();
        for (const us of userServices) {
            await postgresDB.userService.create({
                data: us
            });
        }
        console.log(`✅ Migrated ${userServices.length} user services\n`);

        // 7. Payments
        console.log('📦 Migrating Payments...');
        const payments = await sqliteDB.payment.findMany();
        for (const payment of payments) {
            await postgresDB.payment.create({
                data: payment
            });
        }
        console.log(`✅ Migrated ${payments.length} payments\n`);

        // 8. Documents
        console.log('📦 Migrating Documents...');
        const documents = await sqliteDB.document.findMany();
        for (const doc of documents) {
            await postgresDB.document.create({
                data: doc
            });
        }
        console.log(`✅ Migrated ${documents.length} documents\n`);

        // 9. Support Tickets
        console.log('📦 Migrating Support Tickets...');
        const tickets = await sqliteDB.supportTicket.findMany();
        for (const ticket of tickets) {
            await postgresDB.supportTicket.create({
                data: ticket
            });
        }
        console.log(`✅ Migrated ${tickets.length} support tickets\n`);

        // 10. OTPs
        console.log('📦 Migrating OTPs...');
        const otps = await sqliteDB.oTP.findMany();
        for (const otp of otps) {
            await postgresDB.oTP.create({
                data: otp
            });
        }
        console.log(`✅ Migrated ${otps.length} OTPs\n`);

        // 11. Consultation Requests
        console.log('📦 Migrating Consultation Requests...');
        const consultations = await sqliteDB.consultationRequest.findMany({
            include: { services: true }
        });
        for (const consultation of consultations) {
            const { services, ...consultationData } = consultation;
            const created = await postgresDB.consultationRequest.create({
                data: consultationData
            });

            // Migrate associated services
            for (const service of services) {
                await postgresDB.consultationService.create({
                    data: {
                        consultationId: created.id,
                        serviceCode: service.serviceCode
                    }
                });
            }
        }
        console.log(`✅ Migrated ${consultations.length} consultation requests\n`);

        console.log('═══════════════════════════════════════');
        console.log('✅ Data migration completed successfully!');
        console.log('═══════════════════════════════════════\n');

        // Summary
        console.log('📊 Migration Summary:');
        console.log(`   Service Categories: ${categories.length}`);
        console.log(`   Services: ${services.length}`);
        console.log(`   Service Plans: ${plans.length}`);
        console.log(`   Users: ${users.length}`);
        console.log(`   Admins: ${admins.length}`);
        console.log(`   User Services: ${userServices.length}`);
        console.log(`   Payments: ${payments.length}`);
        console.log(`   Documents: ${documents.length}`);
        console.log(`   Support Tickets: ${tickets.length}`);
        console.log(`   OTPs: ${otps.length}`);
        console.log(`   Consultation Requests: ${consultations.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await sqliteDB.$disconnect();
        await postgresDB.$disconnect();
    }
}

// Run migration
migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
