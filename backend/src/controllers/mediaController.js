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
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
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
    } else if (file.mimetype.startsWith('audio/')) {
      mediaType = 'audio';
    }

    const mediaUrl = `/uploads/${file.filename}`;

    return res.status(200).json({
      mediaUrl,
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

