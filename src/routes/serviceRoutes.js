const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', serviceController.getAllServices); // Public
router.get('/dashboard-stats', verifyToken, serviceController.getDashboardStats); // User - Dashboard Stats
router.get('/my-services', verifyToken, serviceController.getUserServices); // User - specific route first
router.get('/:id', serviceController.getServiceById); // Public
router.post('/select', verifyToken, serviceController.selectService); // User
router.post('/', verifyToken, isAdmin, serviceController.createService); // Admin

module.exports = router;
