const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.get('/users', auth, authController.searchUsers);
router.post('/block', auth, authController.blockUser);
router.post('/unblock', auth, authController.unblockUser);

module.exports = router;

