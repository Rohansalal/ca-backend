// Safe dependency loading
let archiver, PDFDocument;
try {
    archiver = require('archiver');
    PDFDocument = require('pdfkit');
} catch (e) {
    console.error('⚠️  Document generation dependencies missing (archiver, pdfkit). Features disabled.');
}

const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * Document Generator Service
 * Generates invoices, receipts, and service documents
 * Creates ZIP bundles for download after payment
 */

/**
 * Generate Invoice PDF
 */
async function generateInvoice(paymentData, userData, serviceData) {
    return new Promise((resolve, reject) => {
        try {
            if (!PDFDocument) return reject(new Error('PDFKit dependency missing'));
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('INVOICE', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text('Precision Associates', { align: 'center' });
            doc.text('Chartered Accountants', { align: 'center' });
            doc.moveDown();

            // Invoice Details
            doc.fontSize(12).text(`Invoice #: INV-${paymentData.id}`, { align: 'left' });
            doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });
            doc.text(`Payment ID: ${paymentData.transactionId || 'N/A'}`, { align: 'left' });
            doc.moveDown();

            // Bill To
            doc.fontSize(14).text('Bill To:', { underline: true });
            doc.fontSize(10).text(`${userData.name}`);
            doc.text(`${userData.email}`);
            doc.text(`${userData.phone || ''}`);
            doc.moveDown();

            // Service Details
            doc.fontSize(14).text('Service Details:', { underline: true });
            doc.fontSize(10).text(`Service: ${serviceData.name}`);
            doc.text(`Description: ${serviceData.description}`);
            doc.moveDown();

            // Amount Summary
            const baseAmount = parseFloat(paymentData.amount);
            const gstAmount = baseAmount * 0.18;
            const totalAmount = baseAmount + gstAmount;

            doc.fontSize(12);
            doc.text(`Base Amount: ₹${baseAmount.toFixed(2)}`, { align: 'right' });
            doc.text(`GST (18%): ₹${gstAmount.toFixed(2)}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(14).text(`Total Amount: ₹${totalAmount.toFixed(2)}`, { align: 'right', underline: true });
            doc.moveDown();

            // Payment Status
            doc.fontSize(10).fillColor('green').text(`Payment Status: PAID`, { align: 'center' });
            doc.fillColor('black');
            doc.moveDown();

            // Footer
            doc.fontSize(8).text(
                'Thank you for your business! For queries, contact us at support@precisionassociates.com',
                { align: 'center', baseline: 'bottom' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Service Welcome PDF
 */
async function generateServiceWelcome(serviceData, userData) {
    return new Promise((resolve, reject) => {
        try {
            if (!PDFDocument) return reject(new Error('PDFKit dependency missing'));
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(18).text('Welcome to Your CA Service!', { align: 'center' });
            doc.moveDown();

            // Personalized Message
            doc.fontSize(12).text(`Dear ${userData.name},`);
            doc.moveDown();
            doc.text(`Thank you for choosing Precision Associates for ${serviceData.name}.`);
            doc.moveDown();

            // What's Next
            doc.fontSize(14).text('Next Steps:', { underline: true });
            doc.fontSize(10);
            doc.list([
                'Our CA expert will contact you within 24 hours',
                'Prepare required documents (list provided below)',
                'Upload documents through your dashboard',
                'Our team will process your request',
                'You will receive updates via email and dashboard'
            ]);
            doc.moveDown();

            // Required Documents
            doc.fontSize(14).text('Required Documents:', { underline: true });
            doc.fontSize(10);

            let requiredDocs = [];
            try {
                requiredDocs = JSON.parse(serviceData.requiredDocuments || '[]');
            } catch (e) {
                requiredDocs = ['PAN Card', 'Aadhaar Card', 'Supporting Documents'];
            }

            doc.list(requiredDocs);
            doc.moveDown();

            // Contact Info
            doc.fontSize(12).text('Need Help?', { underline: true });
            doc.fontSize(10).text('Email: support@precisionassociates.com');
            doc.text('Phone: +91 98765 43210');
            doc.moveDown();

            // Footer
            doc.fontSize(8).text(
                'This is an automated document. Please do not reply to this document.',
                { align: 'center' }
            );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Create ZIP bundle with all documents
 */
async function createDocumentBundle(userServiceId, userId) {
    try {
        logger.info(`[DocumentGen] Creating bundle for UserService ${userServiceId}`);

        // Fetch data
        const userService = await prisma.userService.findUnique({
            where: { id: userServiceId },
            include: {
                service: true,
                user: true,
                payments: {
                    where: { status: 'SUCCESS' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!userService) {
            throw new Error('UserService not found');
        }

        const payment = userService.payments[0];
        if (!payment) {
            throw new Error('No successful payment found');
        }

        // Generate documents
        const invoicePDF = await generateInvoice(payment, userService.user, userService.service);
        const welcomePDF = await generateServiceWelcome(userService.service, userService.user);

        // Create temp directory for ZIP
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const zipFileName = `service_${userServiceId}_${Date.now()}.zip`;
        const zipPath = path.join(tempDir, zipFileName);
        const output = fs.createWriteStream(zipPath);

        if (!archiver) throw new Error('Archiver dependency missing');
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                logger.info(`[DocumentGen] ZIP created: ${zipPath} (${archive.pointer()} bytes)`);
                resolve({
                    filePath: zipPath,
                    fileName: zipFileName,
                    size: archive.pointer()
                });
            });

            archive.on('error', (err) => {
                logger.error('[DocumentGen] Archive error', err);
                reject(err);
            });

            archive.pipe(output);

            // Add PDFs to archive
            archive.append(invoicePDF, { name: 'Invoice.pdf' });
            archive.append(welcomePDF, { name: 'Service_Welcome.pdf' });

            // Add README
            const readmeContent = `
CA Service Documents
====================

Service: ${userService.service.name}
Customer: ${userService.user.name}
Date: ${new Date().toLocaleDateString()}

Contents:
1. Invoice.pdf - Your payment invoice
2. Service_Welcome.pdf - Welcome guide and next steps

Please keep these documents for your records.

For support: support@precisionassociates.com
            `.trim();

            archive.append(readmeContent, { name: 'README.txt' });

            archive.finalize();
        });
    } catch (error) {
        logger.error('[DocumentGen] Failed to create bundle', error);
        throw error;
    }
}

/**
 * Get download link (with token for security)
 */
async function getDownloadLink(userServiceId, userId) {
    try {
        // Verify ownership
        const userService = await prisma.userService.findUnique({
            where: { id: userServiceId }
        });

        if (!userService || userService.userId !== userId) {
            throw new Error('Unauthorized');
        }

        // Create or retrieve download bundle
        const bundle = await createDocumentBundle(userServiceId, userId);

        // Return download URL (will be secured by auth middleware)
        return {
            downloadUrl: `/api/documents/download/${userServiceId}`,
            fileName: bundle.fileName,
            size: bundle.size
        };
    } catch (error) {
        logger.error('[DocumentGen] Failed to get download link', error);
        throw error;
    }
}

/**
 * Cleanup old temporary files
 */
function cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            logger.info(`[DocumentGen] Cleaned up old file: ${file}`);
        }
    });
}

// Run cleanup on startup and every 6 hours
cleanupTempFiles();
setInterval(cleanupTempFiles, 6 * 60 * 60 * 1000);

module.exports = {
    generateInvoice,
    generateServiceWelcome,
    createDocumentBundle,
    getDownloadLink,
    cleanupTempFiles
};
