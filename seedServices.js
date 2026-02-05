const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const serviceData = [
    {
        category: 'Business Registration',
        slug: 'business-registration',
        description: 'Start your business journey with rightful legal structures.',
        services: [
            { name: 'Proprietorship Registration', slug: 'sole-proprietorship', price: 2999, planName: 'Standard Registration' },
            { name: 'HUF Registration', slug: 'huf-registration', price: 5999, planName: 'Complete Setup' },
            { name: 'Partnership Firm', slug: 'partnership-firm', price: 4999, planName: 'Registration Plan' },
            { name: 'LLP Registration', slug: 'llp-formation', price: 12999, planName: 'Complete Incorporation' },
            { name: 'Private Limited Company', slug: 'pvt-ltd-company', price: 14999, planName: 'Standard Package' },
            { name: 'One Person Company (OPC)', slug: 'opc-registration', price: 14999, planName: 'Complete Setup' },
            { name: 'Public Limited Company', slug: 'public-limited-company', price: 39999, planName: 'Incorporation Kit' },
            { name: 'Section 8 Company', slug: 'section-8-company', price: 24999, planName: 'NGO Setup' },
            { name: 'Trust Registration', slug: 'trust-registration', price: 12499, planName: 'Complete Trust Deed' },
            { name: 'Society Registration', slug: 'society-registration', price: 14999, planName: 'Society Setup Package' },
        ]
    },
    {
        category: 'Tax Registration',
        slug: 'tax-registration',
        description: 'Essential tax registrations for your business.',
        services: [
            { name: 'GST Registration', slug: 'gst-registration', price: 1499, planName: 'Basic Registration' },
            { name: 'PAN Application', slug: 'pan-application', price: 999, planName: 'Assisted Application' },
            { name: 'TAN Application', slug: 'tan-application', price: 1499, planName: 'New TAN Allotment' }
        ]
    },
    {
        category: 'Business Compliances',
        slug: 'business-compliances',
        description: 'Ongoing compliance and filing services.',
        services: [
            { name: 'Book Keeping', slug: 'book-keeping', price: 2999, planName: 'Monthly Service' },
            { name: 'Book Supervision', slug: 'book-supervision', price: 4999, planName: 'Monthly Review' },
            { name: 'Change in Directors/KMP', slug: 'change-directors-kmp', price: 2499, planName: 'DIR-12 Filing' },
            { name: 'Change in Registered Office', slug: 'change-registered-office', price: 2999, planName: 'INC-22 Filing' },
            { name: 'Annual Filing - Company', slug: 'annual-filing-company', price: 4999, planName: 'AOC-4 & MGT-7' },
            { name: 'DIN Application', slug: 'din-application', price: 1499, planName: 'Director ID' },
            { name: 'DIR-3 KYC', slug: 'dir-3-kyc', price: 999, planName: 'Director KYC' },
            { name: 'DIR-3 KYC Web', slug: 'dir-3-kyc-web', price: 499, planName: 'Web Verification' },
            { name: 'Minutes Book Maintenance', slug: 'minutes-book', price: 1999, planName: 'Yearly Maintenance' },
            { name: 'Statutory Registers', slug: 'statutory-registers', price: 2499, planName: 'Register Maintenance' },
            { name: 'Annual Filing - LLP', slug: 'annual-filing-llp', price: 3999, planName: 'Form 11 & Form 8' }
        ]
    },
    {
        category: 'Tax Compliances',
        slug: 'tax-compliances',
        description: 'Timely tax return filings and calculations.',
        services: [
            { name: 'Advance Tax Calculation', slug: 'advance-tax-calc', price: 999, planName: 'Quarterly Calculation' },
            { name: 'ITR Filing', slug: 'itr-filing', price: 1499, planName: 'Assisted Filing' },
            { name: 'TDS Return Filing', slug: 'tds-return', price: 2499, planName: 'Quarterly Filing' },
            { name: 'GST Return Filing', slug: 'gst-return', price: 1999, planName: 'Monthly/Quarterly' },
            { name: 'GST Annual Return', slug: 'gst-annual-return', price: 4999, planName: 'GSTR-9 Filing' }
        ]
    },
    {
        category: 'Audit & Assurance',
        slug: 'audit-assurance',
        description: 'Audits and certifications by Chartered Accountants.',
        services: [
            { name: 'Statutory Audit', slug: 'statutory-audit', price: 14999, planName: 'Company Audit' },
            { name: 'Tax Audit', slug: 'tax-audit', price: 19999, planName: 'Income Tax Audit' },
            { name: 'GST Audit', slug: 'gst-audit', price: 14999, planName: 'GST Reconciliation' },
            { name: 'Certification', slug: 'ca-certification', price: 2999, planName: 'Net Worth/Turnover' }
        ]
    },
    {
        category: 'Other Registrations',
        slug: 'other-registrations',
        description: 'Various other licenses and registrations.',
        services: [
            { name: 'FSSAI Registration', slug: 'fssai-registration', price: 2999, planName: 'Basic Registration' },
            { name: 'Trade License', slug: 'trade-license', price: 4999, planName: 'Municipal License' },
            { name: 'Import Export Code (IEC)', slug: 'iec-code', price: 2999, planName: 'DGFT Registration' },
            { name: 'Labour / Factory License', slug: 'labour-license', price: 7999, planName: 'State Labour Dept' },
            { name: 'Drug License', slug: 'drug-license', price: 14999, planName: 'Retail/Wholesale' },
            { name: 'Pollution Control (NOC)', slug: 'pollution-noc', price: 19999, planName: 'Consent to Establish' },
            { name: 'MSME Registration', slug: 'msme-registration', price: 1499, planName: 'Udyam Registration' },
            { name: 'Digital Signature (DSC)', slug: 'dsc-application', price: 1999, planName: 'Class 3 Signing' },
            { name: 'PF Registration', slug: 'pf-registration', price: 3999, planName: 'EPFO Setup' },
            { name: 'ESI Registration', slug: 'esi-registration', price: 3999, planName: 'ESIC Setup' },
            { name: 'Copyright Registration', slug: 'copyright-registration', price: 4999, planName: 'IPR Filing' },
            { name: 'Trademark Registration', slug: 'trademark-registration', price: 6999, planName: 'TM Application' },
            { name: 'Startup India Registration', slug: 'startup-india', price: 4999, planName: 'DPIIT Recognition' }
        ]
    }
];

async function seedServices() {
    try {
        console.log('🚀 Starting Comprehensive Service Seeding...');

        // We wont delete everything to be safe, but we will upsert.
        // However, to ensure clean slate for this specific request if needed, 
        // we could delete. But let's stick to update/create to preserve IDs if possible.

        for (const cat of serviceData) {
            // 1. Upsert Category
            let category = await prisma.serviceCategory.findUnique({ where: { slug: cat.slug } });

            if (!category) {
                category = await prisma.serviceCategory.create({
                    data: { name: cat.category, slug: cat.slug, description: cat.description }
                });
                console.log(`📁 Created Category: ${cat.category}`);
            } else {
                // Update description if needed
                category = await prisma.serviceCategory.update({
                    where: { id: category.id },
                    data: { name: cat.category, description: cat.description }
                });
                console.log(`📁 Updated Category: ${cat.category}`);
            }

            for (const svc of cat.services) {
                // 2. Upsert Service
                let service = await prisma.service.findUnique({ where: { slug: svc.slug } });

                if (!service) {
                    service = await prisma.service.create({
                        data: {
                            name: svc.name,
                            slug: svc.slug,
                            description: `Professional services for ${svc.name}`,
                            categoryId: category.id,
                            requiredDocuments: JSON.stringify(['PAN', 'Aadhaar', 'Photo']), // Default placeholder
                        }
                    });
                    console.log(`  ✨ Created Service: ${svc.name}`);
                } else {
                    console.log(`  ✨ Service already exists: ${svc.name}`);
                }

                // 3. Upsert Plan (Standard Plan)
                // We look for a plan with this name for this service
                let plan = await prisma.servicePlan.findFirst({
                    where: { serviceId: service.id, name: svc.planName }
                });

                if (!plan) {
                    await prisma.servicePlan.create({
                        data: {
                            serviceId: service.id,
                            name: svc.planName,
                            price: svc.price,
                            features: JSON.stringify(['Professional Consultation', 'Document Drafting', 'Filing/Registration'])
                        }
                    });
                    console.log(`    💰 Created Plan: ${svc.planName} - ₹${svc.price}`);
                } else {
                    // Update price if changed
                    if (Number(plan.price) !== svc.price) {
                        await prisma.servicePlan.update({
                            where: { id: plan.id },
                            data: { price: svc.price }
                        });
                        console.log(`    💰 Updated Price for: ${svc.planName} -> ₹${svc.price}`);
                    }
                }
            }
        }

        console.log('✅ Seeding Completed Successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedServices();
