const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const RefreshToken = require('../models/RefreshToken');

const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

const sendTokenResponse = async (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  const hash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: user._id, tokenHash: hash, expiresAt });
  res.status(statusCode).json({
    status: 'success',
    data: { accessToken, refreshToken, tokenType: 'bearer',
      user: { id: user._id, username: user.username, email: user.email, role: user.role } },
  });
};

module.exports = { sendTokenResponse, signAccessToken, signRefreshToken };
