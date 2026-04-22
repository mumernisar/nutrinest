const express = require('express');
const router  = express.Router();
const authController = require('../controllers/auth.controller');
const { protect }    = require('../middleware/auth');
const validate       = require('../middleware/validate');
const { authLimiter }= require('../middleware/rateLimiter');
const { registerValidator, loginValidator, forgotPasswordValidator,
        resetPasswordValidator, changePasswordValidator } = require('../validators/auth.validators');

router.post('/register',         authLimiter, registerValidator,       validate, authController.register);
router.post('/verify-email',                  authController.verifyEmail);
router.post('/login',            authLimiter, loginValidator,          validate, authController.login);
router.post('/refresh',                       authController.refreshToken);
router.post('/logout',           protect,     authController.logout);
router.post('/forgot-password',  authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password',   authLimiter, resetPasswordValidator,  validate, authController.resetPassword);
router.patch('/change-password', protect, changePasswordValidator,     validate, authController.changePassword);

module.exports = router;
