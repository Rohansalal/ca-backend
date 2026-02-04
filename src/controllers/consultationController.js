const prisma = require('../config/db');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation Schema
const consultationSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[\+]?[0-9\s\-]{10,15}$/).required(), // Accept +91 9876543210 or 9876543210
    city: Joi.string().required(),
    preferredContact: Joi.string().valid('phone', 'email', 'whatsapp').required(),
    clientType: Joi.string().required(),
    businessName: Joi.string().allow('', null),
    industry: Joi.string().required(),
    annualTurnover: Joi.string().required(),
    services: Joi.array().items(Joi.string()).min(1).required(),
    description: Joi.string().allow('', null)
});

// Post Public Request
exports.submitRequest = async (req, res) => {
    try {
        const { error, value } = consultationSchema.validate(req.body);
        if (error) {
            logger.warn('Consultation Validation Failed', { error: error.details[0].message });
            return res.status(400).json({ error: error.details[0].message });
        }

        const { services, ...data } = value;

        const consultation = await prisma.consultationRequest.create({
            data: {
                ...data,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                services: {
                    create: services.map(code => ({ serviceCode: code }))
                }
            },
            include: { services: true }
        });

        logger.info('Consultation Request Submitted', { id: consultation.id, email: consultation.email });
        res.status(201).json({ success: true, message: 'Consultation request submitted successfully' });

    } catch (error) {
        logger.error('Submit Consultation Error', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
};

// Admin: Get All
exports.getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [requests, total] = await prisma.$transaction([
            prisma.consultationRequest.findMany({
                skip,
                take: limit,
                include: { services: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.consultationRequest.count()
        ]);

        res.json({
            data: requests,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Get All Consultations Error', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
};

// Admin: Get One
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await prisma.consultationRequest.findUnique({
            where: { id: parseInt(id) },
            include: { services: true }
        });

        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (error) {
        logger.error('Get Consultation By ID Error', error);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
};

// Admin: Update Status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const request = await prisma.consultationRequest.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        logger.info('Consultation Status Updated', { id, status });
        res.json(request);
    } catch (error) {
        logger.error('Update Consultation Status Error', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};
