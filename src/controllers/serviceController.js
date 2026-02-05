const prisma = require('../config/db');
const logger = require('../utils/logger');

// Public: Get all services organized by category
exports.getAllServices = async (req, res) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            include: {
                services: {
                    include: {
                        plans: true // Include plans for pricing display
                    }
                }
            }
        });

        // If specific format needed, user can request, for now return full hierarchy
        res.json(categories);
    } catch (error) {
        logger.error('Get All Services Error', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
};

// Public: Get a single service by ID (with its plans)
exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) },
            include: {
                plans: true,
                category: true
            }
        });
        if (!service) return res.status(404).json({ error: 'Service not found' });
        res.json(service);
    } catch (error) {
        logger.error(`Get Service By ID Error (${req.params.id})`, error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
};

// User selects a PLAN (Buying a service)
exports.selectService = async (req, res) => {
    try {
        let { planId, serviceSlug } = req.body;
        const userId = req.user.userId;

        // If slug provided instead of planId, resolve it to the first available plan
        if (serviceSlug && !planId) {
            const service = await prisma.service.findUnique({
                where: { slug: serviceSlug },
                include: { plans: true } // Fetch plans to pick the first one
            });

            if (!service) return res.status(404).json({ error: 'Service not found for the given slug' });
            if (!service.plans || service.plans.length === 0) {
                return res.status(400).json({ error: 'No plans available for this service' });
            }

            // Default to the first plan if user selects via generic "Get Started" button
            planId = service.plans[0].id;
        }

        const plan = await prisma.servicePlan.findUnique({
            where: { id: parseInt(planId) },
            include: { service: true }
        });

        if (!plan) return res.status(404).json({ error: 'Service Plan not found' });

        // Check for existing pending service plan to avoid duplicates
        const existingService = await prisma.userService.findFirst({
            where: {
                userId,
                servicePlanId: parseInt(planId),
                status: 'PENDING_PAYMENT'
            }
        });

        if (existingService) {
            return res.status(200).json({ message: 'Service availability confirmed', userService: existingService });
        }

        const userService = await prisma.userService.create({
            data: {
                userId,
                servicePlanId: parseInt(planId),
                status: 'PENDING_PAYMENT'
            }
        });

        logger.info(`User ${userId} selected plan ${planId}`, { userServiceId: userService.id });
        res.status(201).json({ message: 'Service selected', userService });
    } catch (error) {
        logger.error('Select Service Error', error, { userId: req.user.userId, planId: req.body.planId });
        res.status(500).json({ error: 'Failed to select service' });
    }
};

exports.getUserServices = async (req, res) => {
    try {
        const userId = req.user.userId;
        const services = await prisma.userService.findMany({
            where: { userId },
            include: {
                servicePlan: {
                    include: {
                        service: true
                    }
                },
                payments: true,
                documents: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse roadmap JSON from the PARENT Service
        const servicesUnpacked = services.map(us => ({
            ...us,
            serviceName: us.servicePlan.service.name,
            planName: us.servicePlan.name,
            service: {
                ...us.servicePlan.service,
                roadmap: us.servicePlan.service.roadmap ? JSON.parse(us.servicePlan.service.roadmap) : null
            },
            price: us.servicePlan.price
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
            include: {
                servicePlan: {
                    include: { service: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalServices = userServices.length;
        const activeServices = userServices.filter(s => s.status === 'ACTIVE').length;
        const pendingServices = userServices.filter(s => s.status === 'PENDING_PAYMENT').length;
        const completedServices = userServices.filter(s => s.status === 'COMPLETED').length;

        // Flatten hierarchy for easy dashboard consumption
        const recentServices = userServices.map(us => ({
            id: us.id,
            status: us.status,
            serviceName: us.servicePlan.service.name,
            planName: us.servicePlan.name,
            createdAt: us.createdAt
        }));

        res.json({
            stats: {
                total: totalServices,
                active: activeServices,
                pending: pendingServices,
                completed: completedServices
            },
            recentServices: recentServices.slice(0, 5) // Return top 5 recent
        });
    } catch (error) {
        logger.error('Dashboard Stats Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};



// User: Delete a service (Cancel order)
exports.deleteUserService = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const userService = await prisma.userService.findUnique({
            where: { id: parseInt(id) }
        });

        if (!userService) {
            return res.status(404).json({ error: 'Service not found' });
        }

        if (userService.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this service' });
        }

        // Allow deletion if pending payment or cancelled. 
        // Active/Completed services usually shouldn't be deleted by user without admin intervention, but for now strict to PENDING/CANCELLED
        if (!['PENDING_PAYMENT', 'CANCELLED'].includes(userService.status)) {
            return res.status(400).json({ error: 'Cannot delete active or completed services. Please contact support.' });
        }

        await prisma.userService.delete({
            where: { id: parseInt(id) }
        });

        logger.info(`User ${userId} deleted service ${id}`);
        res.json({ message: 'Service removed successfully' });

    } catch (error) {
        logger.error('Delete User Service Error', error, { userId: req.user.userId, serviceId: req.params.id });
        res.status(500).json({ error: 'Failed to delete service' });
    }
};
