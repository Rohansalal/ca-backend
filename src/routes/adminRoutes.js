const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const adminController = require('../controllers/adminController');
const adminAuthController = require('../controllers/adminAuthController');
const { adminAuth, superAdminOnly } = require('../middleware/adminMiddleware');
const consultationController = require('../controllers/consultationController');

/**
 * ==============================================
 * ADMIN ROUTES - PRODUCTION READY  
 * ==============================================
 * Secure admin panel API endpoints
 * All routes protected with adminAuth middleware
 * Super admin routes have additional superAdminOnly middleware
 */

// ============================================
// ADMIN AUTHENTICATION ROUTES (No middleware)
// ============================================

// Admin Login (Separate from user login)
router.post('/login', adminAuthController.adminLogin);

// Verify Admin Token
router.get('/verify-token', adminAuthController.verifyAdminToken);

// Refresh Admin Token
router.post('/refresh-token', adminAuthController.refreshAdminToken);

// ============================================
// ADMIN DASHBOARD ROUTES (Requires adminAuth)
// ============================================

// Dashboard Statistics
router.get('/dashboard/stats', adminAuth, adminController.getDashboardStats);

// Get Admin Profile
router.get('/profile', adminAuth, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.userId,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            isAdmin: req.user.isAdmin,
            isSuperAdmin: req.user.isSuperAdmin
        }
    });
});

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// Get All Users (Paginated, Searchable)
router.get('/users', adminAuth, adminController.getAllUsers);

// Get Single User
router.get('/users/:userId', adminAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ============================================  
// SERVICE MANAGEMENT ROUTES
// ============================================

// Get All Services
router.get('/services', adminAuth, adminController.getAllServices);

// Create Service (Super Admin Only)
router.post('/services', adminAuth, superAdminOnly, adminController.createService);

// Update Service (Super Admin Only)
router.put('/services/:serviceId', adminAuth, superAdminOnly, adminController.updateService);

// Delete Service (Super Admin Only)
router.delete('/services/:serviceId', adminAuth, superAdminOnly, adminController.deleteService);

// ============================================
// ANALYTICS ROUTES
// ============================================

// Service Analytics
router.get('/analytics/services', adminAuth, adminController.getServiceAnalytics);

// Revenue Analytics
router.get('/analytics/revenue', adminAuth, adminController.getRevenueAnalytics);

// Growth Analytics
router.get('/analytics/growth', adminAuth, adminController.getGrowthAnalytics);

// ============================================
// CONSULTATION REQUESTS MANAGEMENT
// ============================================

// Get All Consultation Requests
router.get('/consultations', adminAuth, consultationController.getAllRequests);

// Get Single Consultation
router.get('/consultations/:id', adminAuth, consultationController.getRequestById);

// Update Consultation Status
router.patch('/consultations/:id/status', adminAuth, consultationController.updateStatus);

// ============================================
// SUPPORT TICKETS MANAGEMENT
// ============================================

// Get All Support Tickets
router.get('/tickets', adminAuth, adminController.getSupportTickets);

// Update Ticket Status
router.put('/tickets/:ticketId', adminAuth, adminController.updateTicketStatus);

// ============================================
// SYSTEM ADMINISTRATION ROUTES
// ============================================

// Get System Logs (Super Admin Only)
router.get('/logs', adminAuth, superAdminOnly, adminController.getSystemLogs);

// Verify Admin Status (Used by frontend)
router.get('/verify', adminAuth, adminController.verifyAdminStatus);

// Health Check (No auth required)
router.get('/health', (req, res) => {
    res.json({
        status: 'Admin API operational',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
