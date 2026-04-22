const asyncCatch   = require('../utils/asyncCatch');
const AppError     = require('../utils/AppError');
const User         = require('../models/User');
const Bookmark     = require('../models/Bookmark');
const RefreshToken = require('../models/RefreshToken');

exports.getMe = asyncCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateMe = asyncCatch(async (req, res, next) => {
  const { username, email } = req.body;
  if (!username && !email) throw new AppError('Provide at least one field to update.', 422);
  const updates = {};
  if (username) updates.username = username;
  if (email)    updates.email    = email.toLowerCase().trim();
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ status: 'success', data: { user } });
});

exports.deleteMe = asyncCatch(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  await RefreshToken.updateMany({ user: req.user._id }, { revoked: true });
  res.status(200).json({ status: 'success', message: 'Account deactivated successfully.' });
});

exports.getBookmarks = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const [bookmarks, total] = await Promise.all([
    Bookmark.find({ user: req.user._id })
      .populate('recipe', 'title description tags averageRating prepMinutes cookMinutes')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Bookmark.countDocuments({ user: req.user._id }),
  ]);
  res.status(200).json({ status: 'success', results: bookmarks.length,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, data: { bookmarks } });
});

exports.addBookmark = asyncCatch(async (req, res, next) => {
  const { recipeId } = req.body;
  if (!recipeId) throw new AppError('recipeId is required.', 422);
  const Recipe = require('../models/Recipe');
  const recipe = await Recipe.findById(recipeId);
  if (!recipe)             throw new AppError('Recipe not found.', 404);
  if (!recipe.isPublished) throw new AppError('Cannot bookmark an unpublished recipe.', 403);
  const bookmark = await Bookmark.create({ user: req.user._id, recipe: recipeId });
  res.status(201).json({ status: 'success', data: { bookmark } });
});

exports.removeBookmark = asyncCatch(async (req, res, next) => {
  const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.bookmarkId, user: req.user._id });
  if (!bookmark) throw new AppError('Bookmark not found or does not belong to you.', 404);
  res.status(200).json({ status: 'success', message: 'Bookmark removed.' });
});

exports.getAllUsers = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.status(200).json({ status: 'success', results: users.length, pagination: { page, limit, total }, data: { users } });
});

exports.getUserById = asyncCatch(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError('User not found.', 404);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.updateUserRole = asyncCatch(async (req, res, next) => {
  const { role } = req.body;
  if (!['user','nutritionist','admin'].includes(role)) throw new AppError('Invalid role.', 422);
  const user = await User.findByIdAndUpdate(req.params.userId, { role }, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found.', 404);
  res.status(200).json({ status: 'success', data: { user } });
});

exports.toggleUserActive = asyncCatch(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError('User not found.', 404);
  if (String(user._id) === String(req.user._id)) throw new AppError('You cannot deactivate yourself.', 403);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  if (!user.isActive) await RefreshToken.updateMany({ user: user._id }, { revoked: true });
  res.status(200).json({ status: 'success',
    message: `User account ${user.isActive ? 'reactivated' : 'deactivated'}.`, data: { user } });
});
