const jwt = require('jsonwebtoken');
const asyncCatch = require('../utils/asyncCatch');
const AppError   = require('../utils/AppError');
const User       = require('../models/User');

const protect = asyncCatch(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) throw new AppError('You are not logged in. Please log in to access this resource.', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser)         throw new AppError('The user belonging to this token no longer exists.', 401);
  if (!currentUser.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError('Password was recently changed. Please log in again.', 401);
  }

  req.user = currentUser;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

const optionalAuth = asyncCatch(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch (_) { /* silently skip */ }
  next();
});

module.exports = { protect, restrictTo, optionalAuth };
