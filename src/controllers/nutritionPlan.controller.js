const asyncCatch    = require('../utils/asyncCatch');
const AppError      = require('../utils/AppError');
const NutritionPlan = require('../models/NutritionPlan');
const Recipe        = require('../models/Recipe');

exports.listPlans = asyncCatch(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const filter = { isPublished: true };
  if (req.query.targetAudience) filter.targetAudience = req.query.targetAudience;
  if (req.query.dietType)       filter.dietType       = req.query.dietType;
  const [plans, total] = await Promise.all([
    NutritionPlan.find(filter).populate('createdBy','username nutritionistProfile.credentials')
      .sort('-createdAt').skip((page-1)*limit).limit(limit),
    NutritionPlan.countDocuments(filter),
  ]);
  res.status(200).json({ status:'success', results:plans.length, pagination:{page,limit,total}, data:{plans} });
});

exports.getPlan = asyncCatch(async (req, res, next) => {
  const plan = await NutritionPlan.findById(req.params.planId)
    .populate('createdBy','username nutritionistProfile')
    .populate('weeklyPlan.breakfast weeklyPlan.lunch weeklyPlan.dinner weeklyPlan.snacks',
              'title prepMinutes cookMinutes servings dietLabels nutritionInfo');
  if (!plan) throw new AppError('Nutrition plan not found.', 404);
  const isOwner      = req.user && String(plan.createdBy._id) === String(req.user._id);
  const isPrivileged = req.user && req.user.role === 'admin';
  if (!plan.isPublished && !isOwner && !isPrivileged) throw new AppError('Nutrition plan not found.', 404);
  res.status(200).json({ status:'success', data:{plan} });
});

exports.createPlan = asyncCatch(async (req, res, next) => {
  const { title, description, targetAudience, dietType, durationWeeks, weeklyPlan, dailyCalorieTarget } = req.body;
  if (weeklyPlan && weeklyPlan.length) {
    const ids = [];
    for (const day of weeklyPlan) {
      if (day.breakfast) ids.push(day.breakfast);
      if (day.lunch)     ids.push(day.lunch);
      if (day.dinner)    ids.push(day.dinner);
      if (day.snacks)    ids.push(...day.snacks);
    }
    if (ids.length) {
      const found = await Recipe.countDocuments({ _id: { $in: ids }, isPublished: true });
      if (found !== ids.length) throw new AppError('One or more recipe IDs are invalid or not published.', 422);
    }
  }
  const plan = await NutritionPlan.create({ title, description, targetAudience, dietType,
    durationWeeks, weeklyPlan, dailyCalorieTarget, createdBy: req.user._id, isPublished: false });
  res.status(201).json({ status:'success', data:{plan} });
});

exports.updatePlan = asyncCatch(async (req, res, next) => {
  const plan = await NutritionPlan.findById(req.params.planId);
  if (!plan) throw new AppError('Nutrition plan not found.', 404);
  const isOwner = String(plan.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('You are not authorized to update this plan.', 403);
  ['title','description','targetAudience','dietType','durationWeeks','weeklyPlan','dailyCalorieTarget']
    .forEach((f) => { if (req.body[f] !== undefined) plan[f] = req.body[f]; });
  await plan.save();
  res.status(200).json({ status:'success', data:{plan} });
});

exports.deletePlan = asyncCatch(async (req, res, next) => {
  const plan = await NutritionPlan.findById(req.params.planId);
  if (!plan) throw new AppError('Nutrition plan not found.', 404);
  const isOwner = String(plan.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('Access denied.', 403);
  await plan.deleteOne();
  res.status(200).json({ status:'success', message:'Nutrition plan deleted.' });
});

exports.togglePublish = asyncCatch(async (req, res, next) => {
  const plan = await NutritionPlan.findById(req.params.planId);
  if (!plan) throw new AppError('Nutrition plan not found.', 404);
  const isOwner = String(plan.createdBy) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new AppError('Access denied.', 403);
  plan.isPublished = req.body.publish === true || req.body.publish === 'true';
  await plan.save();
  res.status(200).json({ status:'success', message:`Nutrition plan ${plan.isPublished?'published':'unpublished'}.`, data:{plan} });
});

exports.getMyPlans = asyncCatch(async (req, res) => {
  const plans = await NutritionPlan.find({ createdBy: req.user._id }).sort('-createdAt');
  res.status(200).json({ status:'success', results:plans.length, data:{plans} });
});
