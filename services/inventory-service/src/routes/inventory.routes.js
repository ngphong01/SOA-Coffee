const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/inventory.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const importRules = [
  body('items').isArray({ min: 1 }).withMessage('Items array required'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Valid product_id required'),
  body('items.*.quantity').isFloat({ min: 0.001 }).withMessage('Quantity must be positive'),
];

const adjustRules = [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product_id required'),
  body('new_quantity').isFloat({ min: 0 }).withMessage('new_quantity must be >= 0'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

router.get('/', asyncHandler(controller.getAll));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/alerts', asyncHandler(controller.getLowStockAlerts));
router.get('/transactions', asyncHandler(controller.getTransactions));
router.get('/:productId', asyncHandler(controller.getOne));
router.post('/import', importRules, validate, asyncHandler(controller.importStock));
router.post('/export', importRules, validate, asyncHandler(controller.exportStock));
router.patch('/adjust', adjustRules, validate, asyncHandler(controller.adjustStock));

module.exports = router;
