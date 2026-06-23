const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ApiResponse = require('../../../../shared/utils/response');

const uploadsDir = path.join(__dirname, '..', '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for file uploads from computer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// NEW: Upload file từ máy tính (multipart form-data)
router.post('/upload/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, 'No file uploaded');

    const fileUrl = `/api/uploads/${req.file.filename}`;
    return ApiResponse.success(res, {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 'File uploaded');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
});

// OLD: Upload avatar via base64 in JSON body (giữ lại để tương thích)
router.post('/upload/avatar', express.json({ limit: '3mb' }), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return ApiResponse.unauthorized(res, 'Not authenticated');

    const { image } = req.body;
    if (!image || !image.startsWith('data:image/')) {
      return ApiResponse.badRequest(res, 'Invalid image format. Send base64 data URI.');
    }

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return ApiResponse.badRequest(res, 'Invalid base64 format');

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));

    const avatarUrl = `/api/uploads/${filename}`;
    const { query } = require('../../../../shared/database/mysql');
    await query('UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, userId]);

    return ApiResponse.success(res, { avatar_url: avatarUrl }, 'Avatar uploaded');
  } catch (err) {
    return ApiResponse.error(res, err.message);
  }
});

router.use('/uploads', express.static(uploadsDir));

module.exports = router;
