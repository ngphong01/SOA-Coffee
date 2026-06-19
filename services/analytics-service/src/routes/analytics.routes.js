const express = require('express');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/dashboard', asyncHandler(analyticsController.dashboard));
router.get('/revenue', asyncHandler(analyticsController.revenue));
router.get('/top-products', asyncHandler(analyticsController.topProducts));
// additional 2 api by anhtuan
router.get('/orders', asyncHandler(analyticsController.orderStats));
router.get('/payments', asyncHandler(analyticsController.paymentStats));

module.exports = router;
