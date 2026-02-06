const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const prisma = require('../config/db');
const logger = require('../utils/logger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/documents');

// Create uploads directory if it doesn't exist
const ensureUploadsDirExists = async () => {
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
        logger.info('Created uploads directory:', uploadsDir);
    }
};

// Initialize uploads directory
ensureUploadsDirExists();

// Configure multer for local disk storage
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const userId = req.user.userId;
        const userDir = path.join(uploadsDir, `user_${userId}`);

        try {
            await fs.access(userDir);
        } catch {
            await fs.mkdir(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG), PDFs, and Word documents are allowed'), false);
        }
    }
});

exports.uploadMiddleware = upload.single('file');

exports.uploadDocument = async (req, res) => {
    try {
        const { userServiceId } = req.body;
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

        // Generate file URL (accessible via backend API)
        const fileUrl = `/uploads/documents/user_${userId}/${req.file.filename}`;

        const document = await prisma.document.create({
            data: {
                userId,
                userServiceId: userServiceId ? parseInt(userServiceId) : null,
                url: fileUrl,
                fileName: req.file.originalname,
                fileType: req.file.mimetype
            }
        });

        logger.info('Document Uploaded', { userId, documentId: document.id, fileName: req.file.filename });
        res.status(201).json({
            ...document,
            message: 'Document uploaded successfully'
        });
    } catch (error) {
        logger.error('Document Upload Failed', error, { userId: req.user?.userId });
        console.error(error);
        res.status(500).json({ error: 'Document upload failed: ' + error.message });
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

// Download document endpoint
exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const document = await prisma.document.findUnique({
            where: { id: parseInt(id) }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Check if user owns this document
        if (document.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to document' });
        }

        // Construct file path
        const filePath = path.join(__dirname, '../..', document.url);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            logger.error('File not found on disk', { documentId: id, filePath });
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Send file
        res.download(filePath, document.fileName, (err) => {
            if (err) {
                logger.error('File download error', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download file' });
                }
            }
        });

    } catch (error) {
        logger.error('Download Document Error', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};
