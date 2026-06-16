const express = require('express');
const controller = require('../controllers/settings.controller');
const userController = require('../controllers/user.controller');
const asyncHandler = require('../../../../shared/middleware/asyncHandler');

const router = express.Router();

router.get('/general', asyncHandler(controller.getGeneral));
router.put('/general', asyncHandler(controller.updateGeneral));
router.get('/roles', asyncHandler(controller.getRoles));
router.put('/roles', asyncHandler(controller.updateRoles));
router.get('/users', asyncHandler(controller.getUsers));
router.put('/profile', asyncHandler(userController.updateProfile));

module.exports = router;
