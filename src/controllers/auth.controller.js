const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const asyncCatch  = require('../utils/asyncCatch');
const AppError    = require('../utils/AppError');
const User        = require('../models/User');
const RefreshToken= require('../models/RefreshToken');
const { sendTokenResponse, signAccessToken } = require('../utils/sendTokenResponse');
const sendEmail   = require('../utils/sendEmail');

exports.register = asyncCatch(async (req, res, next) => {
  const { username, email, password, role } = req.body;
  const allowedRole = ['user', 'nutritionist'].includes(role) ? role : 'user';
  const user = await User.create({ username, email, password, role: allowedRole });

  const verifyToken = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({ to: user.email, subject: 'NutriNest — Verify your email',
      html: `<p>Hi ${user.username}, verify with token: <strong>${verifyToken}</strong> (expires 24h)</p>` });
  } catch (_) {
    user.emailVerifyToken = undefined; user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  res.status(201).json({ status: 'success',
    message: 'Account created. Check your email to verify.', data: { userId: user._id, email: user.email } });
});

exports.verifyEmail = asyncCatch(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: Date.now() } });
  if (!user) throw new AppError('Token is invalid or has expired.', 400);
  if (user.isVerified) return res.status(200).json({ status: 'success', message: 'Email already verified.' });

  user.isVerified = true; user.emailVerifyToken = undefined; user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ status: 'success', message: 'Email verified successfully.' });
});

exports.login = asyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Incorrect email or password.', 401);
  if (!user.isVerified)  throw new AppError('Please verify your email before logging in.', 403);
  if (!user.isActive)    throw new AppError('Your account has been deactivated.', 403);
  await sendTokenResponse(user, 200, res);
});

exports.refreshToken = asyncCatch(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token is required.', 400);

  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET); }
  catch (_) { throw new AppError('Invalid or expired refresh token.', 401); }

  const storedTokens = await RefreshToken.find({ user: decoded.id, revoked: false, expiresAt: { $gt: new Date() } });
  let matched = null;
  for (const t of storedTokens) {
    if (await bcrypt.compare(refreshToken, t.tokenHash)) { matched = t; break; }
  }
  if (!matched) throw new AppError('Refresh token has been revoked or is invalid.', 401);

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError('User no longer exists or is inactive.', 401);

  res.status(200).json({ status: 'success', data: { accessToken: signAccessToken(user._id, user.role), tokenType: 'bearer' } });
});

exports.logout = asyncCatch(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const stored = await RefreshToken.find({ user: req.user._id, revoked: false });
    for (const t of stored) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) { t.revoked = true; await t.save(); break; }
    }
  }
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

exports.forgotPassword = asyncCatch(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  try {
    await sendEmail({ to: user.email, subject: 'NutriNest — Password Reset (1 hour)',
      html: `<p>Your reset token: <strong>${resetToken}</strong> (expires 1h)</p>` });
  } catch (_) {
    user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send email. Try again later.', 500);
  }
  res.status(200).json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = asyncCatch(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.body.token || '').digest('hex');
  const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } });
  if (!user) throw new AppError('Reset token is invalid or has expired.', 400);

  user.password = req.body.newPassword;
  user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  res.status(200).json({ status: 'success', message: 'Password updated. Please log in again.' });
});

exports.changePassword = asyncCatch(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword)))
    throw new AppError('Incorrect current password.', 401);
  user.password = req.body.newPassword;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  res.status(200).json({ status: 'success', message: 'Password changed. Please log in again.' });
});
