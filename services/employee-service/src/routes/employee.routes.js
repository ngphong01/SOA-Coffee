const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/employee.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const createRules = [
  body('user_id').isInt({ min: 1 }).withMessage('Valid user_id required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('hire_date').isISO8601().withMessage('Valid hire_date required'),
  body('salary_type').optional().isIn(['hourly', 'monthly']),
  body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated']),
];

const updateRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid employee id required'),
  body('salary_type').optional().isIn(['hourly', 'monthly']),
  body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated']),
];

router.get('/stats', asyncHandler(controller.getStats));
router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', createRules, validate, asyncHandler(controller.create));
router.put('/:id', updateRules, validate, asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
