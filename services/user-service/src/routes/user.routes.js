const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/user.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const createCustomerRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
  body('phone').optional({ nullable: true }).isString(),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
];

const updateCustomerRules = [
  param('id').isInt({ min: 1 }).withMessage('Valid customer id required'),
  body('email').optional({ nullable: true }).isEmail(),
  body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other']),
];

const profileRules = [
  body('full_name').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('avatar_url').optional().isString(),
];

router.get('/customers', asyncHandler(controller.getAllCustomers));
router.get('/customers/:id', asyncHandler(controller.getCustomer));
router.post('/customers', createCustomerRules, validate, asyncHandler(controller.createCustomer));
router.put('/customers/:id', updateCustomerRules, validate, asyncHandler(controller.updateCustomer));
router.delete('/customers/:id', param('id').isInt({ min: 1 }), validate, asyncHandler(controller.deleteCustomer));

router.get('/', asyncHandler(controller.getAllUsers));
router.patch('/profile', profileRules, validate, asyncHandler(controller.updateProfile));
router.patch('/:id/status', param('id').isInt({ min: 1 }), validate, asyncHandler(controller.toggleUserStatus));

module.exports = router;
