const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/starred', auth, messageController.getStarredMessages);
router.post('/', auth, messageController.sendMessage);
router.put('/:id', auth, messageController.editMessage);
router.put('/:id/react', auth, messageController.reactMessage);
router.put('/:id/star', auth, messageController.toggleStarMessage);
router.post('/:id/forward', auth, messageController.forwardMessage);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;

