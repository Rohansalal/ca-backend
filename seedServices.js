const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const services = [
    {
        name: 'Company Incorporation - Private Limited',
        description: 'Register your company as Private Limited with complete legal compliance',
        price: 12999,
        requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Address Proof', 'Photo']),
    },
    {
        name: 'Company Incorporation - Public Limited',
        description: 'Register your company as Public Limited for large-scale operations',
        price: 24999,
        requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Address Proof', 'Photo', 'Board Resolution']),
    },
    {
        name: 'Company Incorporation - OPC',
        description: 'One Person Company registration for solo entrepreneurs',
        price: 8999,
        requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Address Proof', 'Photo']),
    },
    {
        name: 'GST Registration',
        description: 'Register for Goods and Services Tax',
        price: 1999,
        requiredDocuments: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Business Address Proof']),
    },
    {
        name: 'Income Tax Return Filing',
        description: 'File your annual ITR with expert assistance',
        price: 2499,
        requiredDocuments: JSON.stringify(['Form 16', 'Bank Statement', 'Investment Proofs']),
    },
    {
        name: 'Trademark Registration',
        description: 'Protect your brand with trademark registration',
        price: 5999,
        requiredDocuments: JSON.stringify(['Logo', 'Brand Name', 'Applicant Details']),
    },
];

async function seedServices() {
    try {
        for (const service of services) {
            const existing = await prisma.service.findFirst({
                where: { name: service.name }
            });

            if (!existing) {
                await prisma.service.create({ data: service });
                console.log(`✅ Created service: ${service.name}`);
            } else {
                console.log(`Start service already exists: ${service.name}`);
            }
        }
        console.log('🎉 Service seeding completed!');
    } catch (error) {
        console.error('❌ Error seeding services:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedServices();
