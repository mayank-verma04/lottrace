const authService = require('./auth.service');
const apiResponse = require('../../utils/apiResponse');

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res) => {
  const result = await authService.register(req.validatedBody);
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.created(res, result, 'User registered successfully');
};

const login = async (req, res) => {
  const result = await authService.login(req.validatedBody);
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.success(res, result, 'Login successful');
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return apiResponse.unauthorized(res, 'INVALID_TOKEN', 'Refresh token required');
  }
  const result = await authService.refresh({ refreshToken });
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.success(res, result, 'Token refreshed');
};

const logout = async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await authService.logout({ refreshToken, accessToken });
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
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
