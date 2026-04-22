const { body } = require('express-validator');

const TARGET_AUDIENCES = ['general','weight-loss','muscle-gain','diabetic','heart-health','athletic'];
const DIET_TYPES       = ['balanced','vegan','vegetarian','keto','paleo','gluten-free','halal'];
const DAYS             = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const createNutritionPlanValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 800 }),
  body('targetAudience').optional().isIn(TARGET_AUDIENCES),
  body('dietType').optional().isIn(DIET_TYPES),
  body('durationWeeks').notEmpty().isInt({ min: 1, max: 52 }).withMessage('durationWeeks must be 1-52'),
  body('dailyCalorieTarget').optional().isFloat({ min: 0 }),
  body('weeklyPlan').optional().isArray(),
  body('weeklyPlan.*.day').optional().isIn(DAYS),
  body('weeklyPlan.*.breakfast').optional().isMongoId(),
  body('weeklyPlan.*.lunch').optional().isMongoId(),
  body('weeklyPlan.*.dinner').optional().isMongoId(),
  body('weeklyPlan.*.snacks').optional().isArray(),
  body('weeklyPlan.*.snacks.*').optional().isMongoId(),
];

module.exports = { createNutritionPlanValidator };
