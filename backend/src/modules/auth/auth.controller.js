const authService = require('./auth.service');
const apiResponse = require('../../utils/apiResponse');

const isProduction = process.env.NODE_ENV === 'production';

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // In production: secure + none for cross-domain (Vercel -> Backend).
    // In dev: lax (not strict) so the cookie is sent from cross-origin
    // dev clients (scan-pwa on a different port/IP hitting the API).
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res) => {
  const result = await authService.register(req.validatedBody);
  // No tokens issued — user must verify email first
  return apiResponse.created(res, result, 'Registration successful. Please check your email for a verification code.');
};

const login = async (req, res) => {
  const result = await authService.login(req.validatedBody);
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.success(res, result, 'Login successful');
};

const verifyEmail = async (req, res) => {
  const result = await authService.verifyEmail(req.validatedBody);
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.success(res, result, 'Email verified successfully');
};

const resendVerification = async (req, res) => {
  await authService.resendVerification(req.validatedBody);
  return apiResponse.success(res, null, 'If that email is pending verification, a new code has been sent.');
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
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
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

const acceptInvite = async (req, res) => {
  const result = await authService.acceptInvite(req.validatedBody);
  setRefreshTokenCookie(res, result.refreshToken);
  delete result.refreshToken;
  return apiResponse.success(res, result, 'Invitation accepted');
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  acceptInvite,
};
