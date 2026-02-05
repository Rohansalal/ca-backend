const AWS = require('aws-sdk');
const multer = require('multer');
const prisma = require('../config/db');
const logger = require('../utils/logger');

// AWS Config
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Simple file filter
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only images and PDFs are allowed'), false);
        }
    }
});

exports.uploadMiddleware = upload.single('file');

exports.uploadDocument = async (req, res) => {
    try {
        const { userServiceId, serviceId } = req.body;
        const userId = req.user.userId;

        // Check permissions and status
        if (userServiceId) {
            const userService = await prisma.userService.findUnique({
                where: { id: parseInt(userServiceId) }
            });
            if (!userService) return res.status(404).json({ error: 'Service not found' });
            if (userService.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });
            if (userService.status !== 'ACTIVE' && userService.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Service is not active.' });
            }
        }

        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME || 'mock-bucket',
            Key: `documents/user_${userId}/${fileName}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        let fileUrl;
        try {
            if (process.env.AWS_BUCKET_NAME) {
                const data = await s3.upload(params).promise();
                fileUrl = data.Location;
            } else {
                // Mock URL if no bucket
                fileUrl = `https://mock-s3-bucket.com/documents/user_${userId}/${fileName}`;
                logger.warn('Mock S3 Upload used');
            }
        } catch (e) {
            logger.warn("S3 Upload Error, falling back to mock:", e.message);
            fileUrl = `https://mock-s3-bucket.com/documents/user_${userId}/${fileName}`;
        }

        const document = await prisma.document.create({
            data: {
                userId,
                userServiceId: userServiceId ? parseInt(userServiceId) : null,
                url: fileUrl,
                fileName: req.file.originalname,
                fileType: req.file.mimetype
            }
        });

        logger.info('Document Uploaded', { userId, documentId: document.id });
        res.status(201).json(document);
    } catch (error) {
        logger.error('Document Upload Failed', error, { userId: req.user.userId });
        console.error(error);
        res.status(500).json({ error: 'Document upload failed' });
    }
};

exports.getMyDocuments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const docs = await prisma.document.findMany({
            where: { userId },
            orderBy: { uploadedAt: 'desc' },
            include: {
                userService: {
                    include: {
                        servicePlan: {
                            include: {
                                service: true
                            }
                        }
                    }
                }
            }
        });
        res.json(docs);
    } catch (error) {
        logger.error('Get My Documents Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};
