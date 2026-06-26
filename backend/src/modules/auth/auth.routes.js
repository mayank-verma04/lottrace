const express = require('express');
const router = express.Router();

const authController = require('./auth.controller');
const authValidation = require('./auth.validation');
const validate = require('../../middleware/validate');

router.post('/register', validate(authValidation.registerSchema), authController.register);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/refresh', validate(authValidation.refreshSchema), authController.refresh);
router.post('/logout', validate(authValidation.refreshSchema), authController.logout);
router.post('/forgot-password', validate(authValidation.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);

module.exports = router;
