const asyncCatch   = require('../utils/asyncCatch');
const AppError     = require('../utils/AppError');
const MealPlan     = require('../models/MealPlan');
const ShoppingList = require('../models/ShoppingList');
const Recipe       = require('../models/Recipe');

exports.listMealPlans = asyncCatch(async (req, res) => {
  const mealPlans = await MealPlan.find({ owner: req.user._id })
    .sort('-weekStart').populate('slots.recipe','title prepMinutes cookMinutes servings');
  res.status(200).json({ status: 'success', results: mealPlans.length, data: { mealPlans } });
});

exports.createMealPlan = asyncCatch(async (req, res, next) => {
  const { name, weekStart, notes } = req.body;
  const mealPlan = await MealPlan.create({ name, weekStart: new Date(weekStart), owner: req.user._id, notes, slots: [] });
  res.status(201).json({ status: 'success', data: { mealPlan } });
});

exports.getMealPlan = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId)
    .populate('slots.recipe','title description ingredients prepMinutes cookMinutes servings nutritionInfo dietLabels');
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('You do not have access to this meal plan.', 403);
  res.status(200).json({ status: 'success', data: { mealPlan } });
});

exports.updateMealPlan = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId);
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);
  if (req.body.name  !== undefined) mealPlan.name  = req.body.name;
  if (req.body.notes !== undefined) mealPlan.notes = req.body.notes;
  await mealPlan.save();
  res.status(200).json({ status: 'success', data: { mealPlan } });
});

exports.deleteMealPlan = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId);
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);
  await mealPlan.deleteOne();
  await ShoppingList.findOneAndDelete({ mealPlan: mealPlan._id });
  res.status(200).json({ status: 'success', message: 'Meal plan deleted.' });
});

exports.upsertSlot = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId);
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);

  const { day, meal, recipe: recipeId, servings } = req.body;
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) throw new AppError('Recipe not found.', 404);
  if (!recipe.isPublished) throw new AppError('Only published recipes can be added to a meal plan.', 422);

  const idx = mealPlan.slots.findIndex((s) => s.day === day && s.meal === meal);
  const slotData = { day, meal, recipe: recipeId, servings: servings || 1 };
  if (idx > -1) { mealPlan.slots[idx] = slotData; } else { mealPlan.slots.push(slotData); }
  await mealPlan.save();
  await mealPlan.populate('slots.recipe','title servings');
  res.status(200).json({ status: 'success', data: { mealPlan } });
});

exports.removeSlot = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId);
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);
  const { day, meal } = req.body;
  const before = mealPlan.slots.length;
  mealPlan.slots = mealPlan.slots.filter((s) => !(s.day === day && s.meal === meal));
  if (mealPlan.slots.length === before) throw new AppError('Slot not found.', 404);
  await mealPlan.save();
  res.status(200).json({ status: 'success', message: 'Slot removed.', data: { mealPlan } });
});

exports.generateShoppingList = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId).populate('slots.recipe','ingredients servings');
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);
  if (!mealPlan.slots.length) throw new AppError('Cannot generate a shopping list for an empty meal plan.', 422);

  const itemMap = new Map();
  for (const slot of mealPlan.slots) {
    const recipe = slot.recipe;
    if (!recipe || !recipe.ingredients) continue;
    const scale = slot.servings / (recipe.servings || 1);
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}::${ing.unit.toLowerCase()}`;
      if (itemMap.has(key)) { itemMap.get(key).totalQty += ing.quantity * scale; }
      else { itemMap.set(key, { name: ing.name, totalQty: ing.quantity * scale, unit: ing.unit, checked: false }); }
    }
  }
  const items = Array.from(itemMap.values()).map((i) => ({ ...i, totalQty: Math.round(i.totalQty * 100) / 100 }));
  const shoppingList = await ShoppingList.findOneAndUpdate(
    { mealPlan: mealPlan._id },
    { owner: req.user._id, items, generatedAt: new Date() },
    { upsert: true, new: true }
  );
  res.status(201).json({ status: 'success', data: { shoppingList } });
});

exports.getShoppingList = asyncCatch(async (req, res, next) => {
  const mealPlan = await MealPlan.findById(req.params.planId);
  if (!mealPlan) throw new AppError('Meal plan not found.', 404);
  if (String(mealPlan.owner) !== String(req.user._id)) throw new AppError('Access denied.', 403);
  const shoppingList = await ShoppingList.findOne({ mealPlan: req.params.planId });
  if (!shoppingList) throw new AppError('No shopping list found. Generate one first.', 404);
  res.status(200).json({ status: 'success', data: { shoppingList } });
});

exports.toggleShoppingItem = asyncCatch(async (req, res, next) => {
  const shoppingList = await ShoppingList.findOne({ mealPlan: req.params.planId, owner: req.user._id });
  if (!shoppingList) throw new AppError('Shopping list not found.', 404);
  const { itemName } = req.body;
  const item = shoppingList.items.find((i) => i.name.toLowerCase() === itemName?.toLowerCase());
  if (!item) throw new AppError(`Item "${itemName}" not found in shopping list.`, 404);
  item.checked = !item.checked;
  await shoppingList.save();
  res.status(200).json({ status: 'success', data: { shoppingList } });
});
