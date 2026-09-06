const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/', auth, chatController.getUserChats);
router.post('/', auth, chatController.createChat);
router.get('/:id', auth, chatController.getChatById);
router.get('/:id/messages', auth, messageController.getChatMessages);
router.put('/:id/read', auth, messageController.markAsRead);
router.put('/:id/clear', auth, chatController.clearChatMessages);

module.exports = router;

