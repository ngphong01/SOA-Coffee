const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/category.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
];

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', createRules, validate, asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
router.post('/reorder', asyncHandler(controller.reorder));

module.exports = router;