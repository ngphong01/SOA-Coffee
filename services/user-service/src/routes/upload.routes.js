const express = require('express');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../../../../shared/utils/response');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Upload avatar via base64 in JSON body
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
