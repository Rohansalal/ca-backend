const prisma = require('../config/db');
const logger = require('../utils/logger');

// Get Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalAdmins = await prisma.user.count({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
        });

        const totalServices = await prisma.service.count();
        const totalServicesPurchased = await prisma.userService.count();
        const totalServiceTypes = await prisma.userService.groupBy({
            by: ['status'],
            _count: true
        });

        const totalPayments = await prisma.payment.aggregate({
            _sum: { amount: true },
            _count: true,
            where: { status: 'SUCCESS' }
        });

        const totalTickets = await prisma.supportTicket.count();
        const openTickets = await prisma.supportTicket.count({
            where: { status: 'OPEN' }
        });

        const recentUsers = await prisma.user.findMany({
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, name: true, email: true, phone: true, createdAt: true }
        });

        const recentServices = await prisma.userService.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { name: true, email: true } },
                service: { select: { name: true, price: true } }
            }
        });

        logger.info('ADMIN_DASHBOARD_ACCESSED', {
            adminId: req.user.userId,
            adminRole: req.user.role,
            ipAddress: req.ip
        });

        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                totalServices,
                totalServicesPurchased,
                totalRevenue: totalPayments._sum.amount || 0,
                totalPayments: totalPayments._count,
                totalTickets,
                openTickets
            },
            serviceBreakdown: totalServiceTypes,
            recentUsers,
            recentServices
        });
    } catch (error) {
        logger.error('ADMIN_DASHBOARD_ERROR', error, {
            adminId: req.user.userId,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

// Get All Users (Paginated)
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = 'ALL' } = req.query;
        const skip = (page - 1) * limit;

        const whereClause = {
            AND: [
                search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search } }
                    ]
                } : {},
                role !== 'ALL' ? { role } : {}
            ]
        };

        const users = await prisma.user.findMany({
            where: whereClause,
            skip: parseInt(skip),
            take: parseInt(limit),
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
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalCount = await prisma.user.count({ where: whereClause });

        logger.info('ADMIN_GET_USERS', {
            adminId: req.user.userId,
            page,
            limit,
            totalCount
        });

        res.json({
            users,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        logger.error('ADMIN_GET_USERS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get All Services
exports.getAllServices = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const services = await prisma.service.findMany({
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        });

        const totalCount = await prisma.service.count();

        logger.info('ADMIN_GET_SERVICES', {
            adminId: req.user.userId,
            totalCount
        });

        res.json({
            services,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        logger.error('ADMIN_GET_SERVICES_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

// Get Service Purchases Analytics
exports.getServiceAnalytics = async (req, res) => {
    try {
        const serviceAnalytics = await prisma.service.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                _count: { select: { userServices: true } },
                userServices: {
                    select: { status: true }
                }
            }
        });

        const formattedAnalytics = serviceAnalytics.map(service => {
            const statusCount = {
                PENDING_PAYMENT: 0,
                ACTIVE: 0,
                COMPLETED: 0,
                CANCELLED: 0
            };

            service.userServices.forEach(us => {
                statusCount[us.status]++;
            });

            return {
                id: service.id,
                name: service.name,
                price: service.price,
                totalPurchases: service._count.userServices,
                statusBreakdown: statusCount
            };
        });

        logger.info('ADMIN_GET_SERVICE_ANALYTICS', {
            adminId: req.user.userId
        });

        res.json({ analytics: formattedAnalytics });
    } catch (error) {
        logger.error('ADMIN_GET_SERVICE_ANALYTICS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch service analytics' });
    }
};

// Get Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const payments = await prisma.payment.aggregate({
            _sum: { amount: true },
            _count: true,
            where: { status: 'SUCCESS' }
        });

        const paymentsByStatus = await prisma.payment.groupBy({
            by: ['status'],
            _sum: { amount: true },
            _count: true
        });

        const revenueByService = await prisma.payment.groupBy({
            by: ['userServiceId'],
            _sum: { amount: true },
            _count: true,
            where: { status: 'SUCCESS' }
        });

        logger.info('ADMIN_GET_REVENUE_ANALYTICS', {
            adminId: req.user.userId
        });

        res.json({
            totalRevenue: payments._sum.amount || 0,
            totalTransactions: payments._count,
            paymentsByStatus,
            revenueByService
        });
    } catch (error) {
        logger.error('ADMIN_GET_REVENUE_ANALYTICS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
};

// Get Support Tickets
exports.getSupportTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'ALL' } = req.query;
        const skip = (page - 1) * limit;

        const whereClause = status !== 'ALL' ? { status } : {};

        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            skip: parseInt(skip),
            take: parseInt(limit),
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalCount = await prisma.supportTicket.count({ where: whereClause });

        logger.info('ADMIN_GET_TICKETS', {
            adminId: req.user.userId,
            totalCount
        });

        res.json({
            tickets,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        logger.error('ADMIN_GET_TICKETS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// Update Ticket Status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, adminReply } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id: parseInt(ticketId) },
            data: {
                status,
                adminReply: adminReply || null,
                updatedAt: new Date()
            },
            include: { user: true }
        });

        logger.info('ADMIN_UPDATE_TICKET', {
            adminId: req.user.userId,
            ticketId,
            newStatus: status
        });

        res.json({ message: 'Ticket updated successfully', ticket });
    } catch (error) {
        logger.error('ADMIN_UPDATE_TICKET_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to update ticket' });
    }
};

// Create New Service
exports.createService = async (req, res) => {
    try {
        const { name, description, price, requiredDocuments } = req.body;

        const service = await prisma.service.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                requiredDocuments: JSON.stringify(requiredDocuments)
            }
        });

        logger.info('ADMIN_CREATE_SERVICE', {
            adminId: req.user.userId,
            serviceId: service.id,
            serviceName: name
        });

        res.status(201).json({ message: 'Service created successfully', service });
    } catch (error) {
        logger.error('ADMIN_CREATE_SERVICE_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to create service' });
    }
};

// Update Service
exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { name, description, price, requiredDocuments } = req.body;

        const service = await prisma.service.update({
            where: { id: parseInt(serviceId) },
            data: {
                name,
                description,
                price: parseFloat(price),
                requiredDocuments: JSON.stringify(requiredDocuments),
                updatedAt: new Date()
            }
        });

        logger.info('ADMIN_UPDATE_SERVICE', {
            adminId: req.user.userId,
            serviceId
        });

        res.json({ message: 'Service updated successfully', service });
    } catch (error) {
        logger.error('ADMIN_UPDATE_SERVICE_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to update service' });
    }
};

// Delete Service
exports.deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        await prisma.service.delete({
            where: { id: parseInt(serviceId) }
        });

        logger.info('ADMIN_DELETE_SERVICE', {
            adminId: req.user.userId,
            serviceId
        });

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        logger.error('ADMIN_DELETE_SERVICE_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to delete service' });
    }
};

// Get System Logs (Super Admin Only)
exports.getSystemLogs = async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        // This would typically read from a log file
        // For now, we'll return a placeholder
        logger.info('ADMIN_GET_LOGS', {
            adminId: req.user.userId
        });

        res.json({
            message: 'System logs endpoint',
            logs: []
        });
    } catch (error) {
        logger.error('ADMIN_GET_LOGS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// Get Growth Analytics (Time Series)
exports.getGrowthAnalytics = async (req, res) => {
    try {
        // Get last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of the month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // 1. User Growth
        const users = await prisma.user.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true }
        });

        // 2. Revenue Growth
        const payments = await prisma.payment.findMany({
            where: {
                status: 'SUCCESS',
                createdAt: { gte: sixMonthsAgo }
            },
            select: { createdAt: true, amount: true }
        });

        // Process data into monthly buckets
        const months = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                monthKey: `${d.getFullYear()}-${d.getMonth()}`, // Helper for grouping
                users: 0,
                revenue: 0
            });
        }

        users.forEach(u => {
            const d = new Date(u.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const monthObj = months.find(m => m.monthKey === key);
            if (monthObj) monthObj.users++;
        });

        payments.forEach(p => {
            const d = new Date(p.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const monthObj = months.find(m => m.monthKey === key);
            if (monthObj) monthObj.revenue += p.amount;
        });

        // Cleanup helper key
        const finalData = months.map(({ monthKey, ...rest }) => rest);

        logger.info('ADMIN_GET_GROWTH_ANALYTICS', {
            adminId: req.user.userId
        });

        res.json({ growth: finalData });

    } catch (error) {
        logger.error('ADMIN_GET_GROWTH_ANALYTICS_ERROR', error, { adminId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch growth analytics' });
    }
};

// Verify if user is admin
exports.verifyAdminStatus = async (req, res) => {
    try {
        res.json({
            isAdmin: req.user.isAdmin,
            role: req.user.role,
            userId: req.user.userId
        });
    } catch (error) {
        res.status(401).json({ error: 'Not authenticated as admin' });
    }
};
