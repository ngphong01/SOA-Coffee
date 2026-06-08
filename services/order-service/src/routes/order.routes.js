const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');
const validate = require('../../../../shared/middleware/validate');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.get('/', asyncHandler(orderController.getAll));
router.get('/:id', [param('id').isInt()], validate, asyncHandler(orderController.getOne));
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('items.*.product_id').isInt(),
    body('items.*.quantity').optional().isFloat({ min: 0.001 }),
    body('cashier_id').optional().isInt(),
  ],
  validate,
  asyncHandler(orderController.create)
);
router.put('/:id', [param('id').isInt()], validate, asyncHandler(orderController.update));
router.patch(
  '/:id/status',
  [
    param('id').isInt(),
    body('status').isIn(['pending', 'processing', 'completed', 'cancelled', 'refunded']),
  ],
  validate,
  asyncHandler(orderController.updateStatus)
);
router.delete('/:id', [param('id').isInt()], validate, asyncHandler(orderController.remove));

module.exports = router;
