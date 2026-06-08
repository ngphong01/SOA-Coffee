const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/promotion.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['percentage', 'fixed_amount', 'buy_x_get_y']).withMessage('Valid type required'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be >= 0'),
  body('starts_at').notEmpty().withMessage('starts_at is required'),
  body('applies_to').optional().isIn(['all', 'category', 'product']),
  body('coupon_count').optional().isInt({ min: 1, max: 1000 }),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid promotion id required'),
  body('value').optional().isFloat({ min: 0 }),
];

const validateCouponRules = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('order_amount').optional().isFloat({ min: 0 }),
];

const generateCouponsRules = [
  body('promotion_id').isInt({ min: 1 }).withMessage('Valid promotion_id required'),
  body('count').optional().isInt({ min: 1, max: 500 }),
  body('usage_limit').optional().isInt({ min: 1 }),
];

router.get('/coupons', asyncHandler(controller.getAllCoupons));
router.post('/coupons/validate', validateCouponRules, validate, asyncHandler(controller.validateCoupon));
router.post('/coupons/generate', generateCouponsRules, validate, asyncHandler(controller.generateCoupons));

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', createRules, validate, asyncHandler(controller.create));
router.put('/:id', updateRules, validate, asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
