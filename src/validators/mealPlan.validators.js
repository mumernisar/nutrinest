const { body } = require('express-validator');

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['breakfast','lunch','dinner','snack'];

const createMealPlanValidator = [
  body('name').trim().notEmpty().withMessage('Plan name is required').isLength({ max: 80 }),
  body('weekStart').notEmpty().withMessage('weekStart is required')
    .isISO8601().withMessage('weekStart must be a valid date (YYYY-MM-DD)')
    .custom((val) => { const d = new Date(val); if (d.getDay() !== 1) throw new Error('weekStart must be a Monday'); return true; }),
  body('notes').optional().isLength({ max: 500 }),
];

const mealSlotValidator = [
  body('day').notEmpty().isIn(DAYS).withMessage(`day must be one of: ${DAYS.join(', ')}`),
  body('meal').notEmpty().isIn(MEALS).withMessage(`meal must be one of: ${MEALS.join(', ')}`),
  body('recipe').notEmpty().isMongoId().withMessage('recipe must be a valid MongoDB ObjectId'),
  body('servings').optional().isInt({ min: 1 }),
];

module.exports = { createMealPlanValidator, mealSlotValidator };
