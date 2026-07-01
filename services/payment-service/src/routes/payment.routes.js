const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/payment.controller');
const stripeController = require('../controllers/stripe.controller');
const validate = require('../../../../shared/middleware/validate');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

const processRules = [
  body('order_id').isInt({ min: 1 }).withMessage('Valid order_id required'),
  body('method').isIn(['cash', 'card', 'e_wallet', 'bank_transfer']).withMessage('Invalid payment method'),
  body('amount_tendered').optional().isFloat({ min: 0 }),
];

const refundRules = [
  body('refund_amount').isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
  body('reason').notEmpty().withMessage('Refund reason required'),
];

router.get('/', asyncHandler(controller.getAll));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/process', processRules, validate, asyncHandler(controller.processPayment));
router.post('/:id/refund', refundRules, validate, asyncHandler(controller.processRefund));
router.delete('/:id', asyncHandler(controller.remove));

// Stripe checkout routes
router.post('/stripe/create-session', asyncHandler(stripeController.createCheckoutSession));
router.post('/stripe/confirm', asyncHandler(stripeController.confirmPayment));

module.exports = router;