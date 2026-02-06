const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/authMiddleware');
const documentGenerator = require('../services/documentGenerator');
const fs = require('fs');

// Upload document for a service
router.post('/upload', verifyToken, documentController.uploadMiddleware, documentController.uploadDocument);

// Get user's documents
router.get('/', verifyToken, documentController.getMyDocuments);

// Download single document
router.get('/download-file/:id', verifyToken, documentController.downloadDocument);

// Download service documents bundle (ZIP)
router.get('/download/:userServiceId', verifyToken, async (req, res) => {
    try {
        const { userServiceId } = req.params;
        const userId = req.user.userId;

        // Generate/retrieve bundle
        const bundleInfo = await documentGenerator.createDocumentBundle(
            parseInt(userServiceId),
            userId
        );

        // Stream the file
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${bundleInfo.fileName}"`);
        res.setHeader('Content-Length', bundleInfo.size);

        const fileStream = fs.createReadStream(bundleInfo.filePath);
        fileStream.pipe(res);

        // Cleanup after download
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    fs.unlinkSync(bundleInfo.filePath);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }, 5000);
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download documents' });
    }
});

// Get download link (without triggering download)
router.get('/download-link/:userServiceId', verifyToken, async (req, res) => {
    try {
        const { userServiceId } = req.params;
        const userId = req.user.userId;

        const downloadInfo = await documentGenerator.getDownloadLink(
            parseInt(userServiceId),
            userId
        );

        res.json(downloadInfo);
    } catch (error) {
        console.error('Get download link error:', error);
        res.status(500).json({ error: 'Failed to get download link' });
    }
});

module.exports = router;
