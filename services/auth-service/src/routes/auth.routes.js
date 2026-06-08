const express = require('express');
const { body } = require('express-validator');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');
const validate = require('../../../../shared/middleware/validate');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 characters'),
    body('phone').optional().isString(),
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  validate,
  asyncHandler(authController.login)
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  asyncHandler(authController.refresh)
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  asyncHandler(authController.forgotPassword)
);

module.exports = router;
