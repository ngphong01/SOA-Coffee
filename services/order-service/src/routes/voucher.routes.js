const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');
const validate = require('../../../../shared/middleware/validate');
const voucherController = require('../controllers/voucher.controller');

const router = express.Router();

router.get('/', asyncHandler(voucherController.getAll));
router.get('/:id', [param('id').isInt()], validate, asyncHandler(voucherController.getOne));
router.post(
  '/',
  [
    body('code').trim().notEmpty().withMessage('Mã voucher là bắt buộc'),
    body('type').optional().isIn(['percentage', 'fixed']),
    body('value').isFloat({ min: 0.01 }).withMessage('Giá trị phải > 0'),
    body('min_order_value').optional().isFloat({ min: 0 }),
    body('max_usage').optional().isInt({ min: 1 }),
    body('is_active').optional().isBoolean(),
    body('description').optional().isString(),
  ],
  validate,
  asyncHandler(voucherController.create)
);
router.put(
  '/:id',
  [
    param('id').isInt(),
    body('code').optional().trim().notEmpty(),
    body('type').optional().isIn(['percentage', 'fixed']),
    body('value').optional().isFloat({ min: 0.01 }),
    body('min_order_value').optional().isFloat({ min: 0 }),
    body('max_usage').optional().isInt({ min: 1 }),
    body('is_active').optional().isBoolean(),
  ],
  validate,
  asyncHandler(voucherController.update)
);
router.delete('/:id', [param('id').isInt()], validate, asyncHandler(voucherController.remove));
router.post('/validate', [
  body('code').trim().notEmpty(),
  body('order_total').optional().isFloat({ min: 0 }),
], validate, asyncHandler(voucherController.validate));

module.exports = router;
