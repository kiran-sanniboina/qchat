const express = require('express');
const router = express.Router();
const { upload, uploadFile } = require('../controllers/mediaController');
const auth = require('../middleware/auth');

router.post('/upload', auth, upload.single('file'), uploadFile);

module.exports = router;

