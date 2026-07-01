require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const multer = require('multer');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const productRoutes = require('./routes/product.routes');

const logger = createLogger('Product-Service');
const app = express();
const PORT = process.env.PORT || 3003;

// Upload dir
const uploadDir = path.join('/app', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp, gif, svg) are allowed'));
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads/products', express.static(uploadDir));

app.use('/api/products', productRoutes);

// Upload image endpoint
app.post('/api/products/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { query } = require('../../../shared/database/mysql');
    const imageUrl = `/uploads/products/${req.file.filename}`;
    await query('UPDATE products SET thumbnail_url = ? WHERE id = ?', [imageUrl, req.params.id]);
    res.json({ success: true, data: { thumbnail_url: imageUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

bootstrapService({
  serviceName: 'product-service',
  port: PORT,
  app,
  onReady: async () => {
    try {
      createPool();
      await testConnection();
      await createRedisClient();
    } catch (error) {
      logger.error('Failed to start Product Service:', error);
      process.exit(1);
    }
  }
});
