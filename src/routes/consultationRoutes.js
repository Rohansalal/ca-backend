const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminMiddleware');

// Public API
router.post('/', consultationController.submitRequest);

// Admin Protected APIs
router.get('/', adminAuth, consultationController.getAllRequests);
router.get('/:id', adminAuth, consultationController.getRequestById);
router.patch('/:id/status', adminAuth, consultationController.updateStatus);

module.exports = router;
