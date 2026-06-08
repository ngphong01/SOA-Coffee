const express = require('express');
const { body, param } = require('express-validator');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');
const validate = require('../../../../shared/middleware/validate');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/', asyncHandler(productController.getAll));
router.get('/:id', [param('id').isInt()], validate, asyncHandler(productController.getOne));
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('sku').trim().notEmpty(),
    body('category_id').isInt(),
    body('price').isFloat({ min: 0 }),
    body('initial_stock').optional().isFloat({ min: 0 }),
  ],
  validate,
  asyncHandler(productController.create)
);
router.put('/:id', [param('id').isInt()], validate, asyncHandler(productController.update));
router.delete('/:id', [param('id').isInt()], validate, asyncHandler(productController.remove));

module.exports = router;
