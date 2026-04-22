const asyncCatch = require('../utils/asyncCatch');
const AppError   = require('../utils/AppError');
const Review     = require('../models/Review');
const Recipe     = require('../models/Recipe');

exports.listReviews = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe || !recipe.isPublished) throw new AppError('Recipe not found.', 404);
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const [reviews, total] = await Promise.all([
    Review.find({ recipe: req.params.recipeId, flagged: false })
      .populate('author','username').sort('-createdAt').skip((page-1)*limit).limit(limit),
    Review.countDocuments({ recipe: req.params.recipeId, flagged: false }),
  ]);
  res.status(200).json({ status: 'success', results: reviews.length, pagination: { page, limit, total }, data: { reviews } });
});

exports.createReview = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe || !recipe.isPublished) throw new AppError('Recipe not found.', 404);
  if (String(recipe.author) === String(req.user._id)) throw new AppError('You cannot review your own recipe.', 403);
  const { rating, comment } = req.body;
  if (!rating) throw new AppError('Rating is required.', 422);
  const review = await Review.create({ recipe: req.params.recipeId, author: req.user._id, rating, comment });
  await review.populate('author','username');
  res.status(201).json({ status: 'success', data: { review } });
});

exports.updateReview = asyncCatch(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError('Review not found.', 404);
  if (String(review.author) !== String(req.user._id)) throw new AppError('You can only edit your own reviews.', 403);
  if (req.body.rating  !== undefined) review.rating  = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();
  res.status(200).json({ status: 'success', data: { review } });
});

exports.deleteReview = asyncCatch(async (req, res, next) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError('Review not found.', 404);
  const isOwner = String(review.author) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('You are not authorized to delete this review.', 403);
  await Review.findOneAndDelete({ _id: review._id });
  res.status(200).json({ status: 'success', message: 'Review deleted.' });
});
