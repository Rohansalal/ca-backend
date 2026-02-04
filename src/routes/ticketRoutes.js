const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, ticketController.createTicket);
router.get('/my-tickets', verifyToken, ticketController.getMyTickets); // User
router.get('/all', verifyToken, isAdmin, ticketController.getAllTickets); // Admin
router.post('/reply', verifyToken, isAdmin, ticketController.replyTicket); // Admin

module.exports = router;
