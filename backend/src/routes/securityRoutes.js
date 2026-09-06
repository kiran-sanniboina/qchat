const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const auth = require('../middleware/auth');

router.get('/:chatId/status', auth, securityController.getChatSecurityStatus);
router.get('/:chatId/threats', auth, securityController.getChatThreats);
router.post('/:chatId/refresh-e91', auth, securityController.refreshE91);
router.post('/simulate-attack', auth, securityController.simulateAttack);
router.get('/benchmark/matrix', auth, securityController.getBenchmarkMatrix);
router.post('/teleport/simulate-steps', auth, securityController.simulateTeleportSteps);

module.exports = router;

