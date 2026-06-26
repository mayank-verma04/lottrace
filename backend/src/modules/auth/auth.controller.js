const authService = require('./auth.service');
const apiResponse = require('../../utils/apiResponse');

const register = async (req, res) => {
  const result = await authService.register(req.validatedBody);
  return apiResponse.created(res, result, 'User registered successfully');
};

const login = async (req, res) => {
  const result = await authService.login(req.validatedBody);
  return apiResponse.success(res, result, 'Login successful');
};

const refresh = async (req, res) => {
  const result = await authService.refresh(req.validatedBody);
  return apiResponse.success(res, result, 'Token refreshed');
};

const logout = async (req, res) => {
  await authService.logout(req.validatedBody);
  return apiResponse.success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  // TODO: implement real email sending
  console.log('Forgot password requested for:', req.validatedBody.email);
  return apiResponse.success(res, null, 'If that email exists, a reset link has been sent');
};

const resetPassword = async (req, res) => {
  // TODO: implement actual password reset
  return apiResponse.success(res, null, 'Password reset successfully');
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
