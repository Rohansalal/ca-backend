const prisma = require('../config/db');
const logger = require('../utils/logger');

exports.getAllServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany();
        res.json(services);
    } catch (error) {
        logger.error('Get All Services Error', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (error) {
        logger.error(`Get Service By ID Error (${req.params.id})`, error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
};

// User selects a service
exports.selectService = async (req, res) => {
    try {
        const { serviceId } = req.body;
        const userId = req.user.userId;

        const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } });
        if (!service) return res.status(404).json({ error: 'Service not found' });

        const userService = await prisma.userService.create({
            data: {
                userId,
                serviceId: parseInt(serviceId),
                status: 'PENDING_PAYMENT'
            }
        });

        logger.info(`User ${userId} selected service ${serviceId}`, { userServiceId: userService.id });
        res.status(201).json({ message: 'Service selected', userService });
    } catch (error) {
        logger.error('Select Service Error', error, { userId: req.user.userId, serviceId: req.body.serviceId });
        res.status(500).json({ error: 'Failed to select service' });
    }
};

exports.getUserServices = async (req, res) => {
    try {
        const userId = req.user.userId;
        const services = await prisma.userService.findMany({
            where: { userId },
            include: { service: true, payments: true, documents: true },
            orderBy: { createdAt: 'desc' }
        });

        // Parse roadmap JSON
        const servicesUnpacked = services.map(us => ({
            ...us,
            service: {
                ...us.service,
                roadmap: us.service.roadmap ? JSON.parse(us.service.roadmap) : null
            }
        }));

        res.json(servicesUnpacked);
    } catch (error) {
        logger.error('Get User Services Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch user services' });
    }
};

// Get User Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Fetch all user services with service details
        const userServices = await prisma.userService.findMany({
            where: { userId },
            include: { service: true },
            orderBy: { createdAt: 'desc' }
        });

        const totalServices = userServices.length;
        const activeServices = userServices.filter(s => s.status === 'ACTIVE').length;
        const pendingServices = userServices.filter(s => s.status === 'PENDING_PAYMENT').length;
        const completedServices = userServices.filter(s => s.status === 'COMPLETED').length;

        // Parse roadmap for services (if string)
        const servicesWithRoadmap = userServices.map(us => ({
            ...us,
            service: {
                ...us.service,
                roadmap: us.service.roadmap ? JSON.parse(us.service.roadmap) : null
            }
        }));

        res.json({
            stats: {
                total: totalServices,
                active: activeServices,
                pending: pendingServices,
                completed: completedServices
            },
            recentServices: servicesWithRoadmap.slice(0, 5) // Return top 5 recent
        });
    } catch (error) {
        logger.error('Dashboard Stats Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// Admin: Create a new service (Seed helper)
exports.createService = async (req, res) => {
    try {
        const { name, description, price, requiredDocuments, roadmap } = req.body;
        const service = await prisma.service.create({
            data: {
                name,
                description,
                price,
                requiredDocuments: typeof requiredDocuments === 'object' ? JSON.stringify(requiredDocuments) : requiredDocuments,
                roadmap: typeof roadmap === 'object' ? JSON.stringify(roadmap) : roadmap
            }
        });
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
