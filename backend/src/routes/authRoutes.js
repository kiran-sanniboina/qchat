const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/email-status', authController.getEmailStatus);

// QR Code Device Pairing Routes
router.post('/qr/init', authController.initQrSession);
router.get('/qr/status/:sessionId', authController.checkQrSessionStatus);
router.post('/qr/authorize', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return auth(req, res, next);
  }
  next();
}, authController.authorizeQrSession);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);
router.get('/users', auth, authController.searchUsers);
router.post('/block', auth, authController.blockUser);
router.post('/unblock', auth, authController.unblockUser);

module.exports = router;

