const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');

router.use(authLimiter);

router.post('/register', validate(authValidation.registerSchema), authController.register);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/verify-email', validate(authValidation.verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validate(authValidation.resendVerificationSchema), authController.resendVerification);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);
router.post('/accept-invite', validate(authValidation.acceptInviteSchema), authController.acceptInvite);

module.exports = router;
