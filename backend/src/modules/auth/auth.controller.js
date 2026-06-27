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
  const accessToken = req.headers.authorization?.split(' ')[1];
  await authService.logout({ ...req.validatedBody, accessToken });
  return apiResponse.success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.validatedBody);
  return apiResponse.success(res, null, 'If that email exists, a reset link has been sent');
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.validatedBody);
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
