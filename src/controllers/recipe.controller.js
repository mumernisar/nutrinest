const asyncCatch  = require('../utils/asyncCatch');
const AppError    = require('../utils/AppError');
const Recipe      = require('../models/Recipe');
const APIFeatures = require('../utils/apiFeatures');

exports.listRecipes = asyncCatch(async (req, res) => {
  let baseQuery = Recipe.find({ isPublished: true });
  if (req.query.dietLabel) {
    const labels = Array.isArray(req.query.dietLabel) ? req.query.dietLabel : [req.query.dietLabel];
    baseQuery = baseQuery.where('dietLabels').in(labels);
  }
  const features = new APIFeatures(baseQuery, req.query).filter().search(['title','description','tags']).sort().limitFields().paginate();
  const total = await Recipe.countDocuments({ isPublished: true });
  const recipes = await features.query.populate('author', 'username');
  res.status(200).json({ status: 'success', results: recipes.length,
    pagination: { page: features._page, limit: features._limit, total, totalPages: Math.ceil(total / features._limit) },
    data: { recipes } });
});

exports.getRecipe = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId)
    .populate('author', 'username role')
    .populate('nutritionInfo.verifiedBy', 'username');
  if (!recipe) throw new AppError('Recipe not found.', 404);

  const isOwner      = req.user && String(recipe.author._id) === String(req.user._id);
  const isPrivileged = req.user && ['admin','nutritionist'].includes(req.user.role);
  if (!recipe.isPublished && !isOwner && !isPrivileged) throw new AppError('Recipe not found.', 404);

  res.status(200).json({ status: 'success', data: { recipe } });
});

exports.getMyRecipes = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const [recipes, total] = await Promise.all([
    Recipe.find({ author: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Recipe.countDocuments({ author: req.user._id }),
  ]);
  res.status(200).json({ status: 'success', results: recipes.length, pagination: { page, limit, total }, data: { recipes } });
});

exports.createRecipe = asyncCatch(async (req, res) => {
  const { title, description, ingredients, steps, tags, dietLabels, prepMinutes, cookMinutes, servings, difficulty } = req.body;
  const recipe = await Recipe.create({ title, description, ingredients, steps, tags, dietLabels,
    prepMinutes, cookMinutes, servings, difficulty, author: req.user._id, isPublished: false });
  res.status(201).json({ status: 'success', data: { recipe } });
});

exports.updateRecipe = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  const isOwner = String(recipe.author) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('You are not authorized to update this recipe.', 403);

  ['title','description','ingredients','steps','tags','dietLabels','prepMinutes','cookMinutes','servings','difficulty']
    .forEach((f) => { if (req.body[f] !== undefined) recipe[f] = req.body[f]; });
  if (!isAdmin) recipe.isVerified = false;
  await recipe.save();
  res.status(200).json({ status: 'success', data: { recipe } });
});

exports.deleteRecipe = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  const isOwner = String(recipe.author) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('You are not authorized to delete this recipe.', 403);

  const MealPlan = require('../models/MealPlan');
  const inUse = await MealPlan.findOne({ 'slots.recipe': recipe._id });
  if (inUse) throw new AppError('Cannot delete — recipe is used in one or more meal plans.', 409);

  await recipe.deleteOne();
  res.status(200).json({ status: 'success', message: 'Recipe deleted successfully.' });
});

exports.togglePublish = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  recipe.isPublished = req.body.publish === true || req.body.publish === 'true';
  await recipe.save();
  res.status(200).json({ status: 'success', message: `Recipe ${recipe.isPublished ? 'published' : 'unpublished'}.`, data: { recipe } });
});

exports.flagRecipe = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  recipe.flagged    = req.body.flagged === true;
  recipe.flagReason = recipe.flagged ? (req.body.reason || '') : '';
  if (recipe.flagged) recipe.isPublished = false;
  await recipe.save();
  res.status(200).json({ status: 'success', message: `Recipe ${recipe.flagged ? 'flagged' : 'unflagged'}.`, data: { recipe } });
});

exports.addNutritionInfo = asyncCatch(async (req, res, next) => {
  const recipe = await Recipe.findById(req.params.recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  const { calories, protein, carbs, fat, fiber, sugar, sodium, notes } = req.body;
  recipe.nutritionInfo = { calories, protein, carbs, fat, fiber, sugar, sodium, notes,
    verifiedBy: req.user._id, verifiedAt: new Date() };
  recipe.isVerified = true;
  await recipe.save();
  res.status(200).json({ status: 'success', message: 'Nutrition info saved; recipe marked verified.', data: { recipe } });
});

exports.listUnverified = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const [recipes, total] = await Promise.all([
    Recipe.find({ isPublished: true, isVerified: false })
      .populate('author', 'username email').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Recipe.countDocuments({ isPublished: true, isVerified: false }),
  ]);
  res.status(200).json({ status: 'success', results: recipes.length, pagination: { page, limit, total }, data: { recipes } });
});

exports.adminListRecipes = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = {};
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
  if (req.query.flagged     !== undefined) filter.flagged     = req.query.flagged     === 'true';
  if (req.query.isVerified  !== undefined) filter.isVerified  = req.query.isVerified  === 'true';
  const [recipes, total] = await Promise.all([
    Recipe.find(filter).populate('author','username email role').sort('-createdAt').skip((page-1)*limit).limit(limit),
    Recipe.countDocuments(filter),
  ]);
  res.status(200).json({ status: 'success', results: recipes.length, pagination: { page, limit, total }, data: { recipes } });
});
