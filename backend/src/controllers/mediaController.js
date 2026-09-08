const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;
    let mediaType = 'document';
    if (file.mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      const isVoice = req.body.isVoice === 'true' || req.query.isVoice === 'true' || file.originalname.toLowerCase().includes('voice');
      mediaType = isVoice ? 'voice' : 'audio';
    }

    const host = req.get('host') || 'localhost:5000';
    const isProduction = process.env.NODE_ENV === 'production' || host.includes('render.com');
    const baseUrl = isProduction
      ? 'https://qchat-backend-8tbz.onrender.com'
      : `${req.protocol}://${host}`;
    const mediaUrl = `${baseUrl}/uploads/${file.filename}`;

    return res.status(200).json({
      mediaUrl,
      relativeUrl: `/uploads/${file.filename}`,
      mediaType,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Error processing uploaded file.' });
  }
};

module.exports = {
  upload,
  uploadFile
};

