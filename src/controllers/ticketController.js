const prisma = require('../config/db');
const logger = require('../utils/logger');

exports.createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.userId;

        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                subject,
                message,
                status: 'OPEN'
            }
        });
        logger.info('Ticket Created', { userId, ticketId: ticket.id });
        res.status(201).json(ticket);
    } catch (error) {
        logger.error('Create Ticket Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        const userId = req.user.userId;
        const tickets = await prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        logger.error('Get My Tickets Error', error, { userId: req.user.userId });
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// Admin action
exports.replyTicket = async (req, res) => {
    try {
        const { ticketId, reply, status } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id: parseInt(ticketId) },
            data: {
                adminReply: reply,
                status: status || 'RESOLVED'
            }
        });
        logger.info('Ticket Replied', { ticketId, status });
        res.json(ticket);
    } catch (error) {
        logger.error('Reply Ticket Error', error, { ticketId: req.body.ticketId });
        res.status(500).json({ error: 'Failed to reply to ticket' });
    }
};

// Admin action
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        logger.error('Get All Tickets Error', error);
        res.status(500).json({ error: 'Failed to fetch all tickets' });
    }
};
