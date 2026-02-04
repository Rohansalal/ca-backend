const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Public API
router.post('/', consultationController.submitRequest);

// Admin Protected APIs
router.get('/', verifyToken, isAdmin, consultationController.getAllRequests);
router.get('/:id', verifyToken, isAdmin, consultationController.getRequestById);
router.patch('/:id/status', verifyToken, isAdmin, consultationController.updateStatus);

module.exports = router;
