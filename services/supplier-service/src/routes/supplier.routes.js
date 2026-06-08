const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/supplier.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const createSupplierRules = [
  body('company_name').trim().notEmpty().withMessage('Company name is required'),
  body('email').optional({ nullable: true }).isEmail(),
  body('payment_terms').optional().isInt({ min: 0 }),
];

const updateSupplierRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid supplier id required'),
  body('email').optional({ nullable: true }).isEmail(),
];

const createPORules = [
  body('supplier_id').isInt({ min: 1 }).withMessage('Valid supplier_id required'),
  body('items').isArray({ min: 1 }).withMessage('Items array required'),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity_ordered').isFloat({ min: 0.001 }),
  body('items.*.unit_cost').isFloat({ min: 0 }),
];

const updatePOStatusRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid purchase order id required'),
  body('status').isIn(['draft', 'confirmed', 'shipped', 'received', 'paid', 'cancelled'])
    .withMessage('Valid status required'),
  body('received_items').optional().isArray(),
  body('received_items.*.product_id').optional().isInt({ min: 1 }),
  body('received_items.*.quantity_received').optional().isFloat({ min: 0 }),
];

router.get('/purchase-orders', asyncHandler(controller.getAllPurchaseOrders));
router.post('/purchase-orders', createPORules, validate, asyncHandler(controller.createPurchaseOrder));
router.patch('/purchase-orders/:id/status', updatePOStatusRules, validate, asyncHandler(controller.updatePOStatus));

router.get('/', asyncHandler(controller.getAllSuppliers));
router.get('/:id', asyncHandler(controller.getSupplier));
router.post('/', createSupplierRules, validate, asyncHandler(controller.createSupplier));
router.put('/:id', updateSupplierRules, validate, asyncHandler(controller.updateSupplier));
router.delete('/:id', asyncHandler(controller.removeSupplier));

module.exports = router;
