const { body, query } = require('express-validator');

const DIET_LABELS  = ['vegan','vegetarian','gluten-free','dairy-free','keto','paleo','halal','low-sodium','high-protein'];
const DIFFICULTIES = ['easy','medium','hard'];

const createRecipeValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 120 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient required'),
  body('ingredients.*.name').trim().notEmpty().withMessage('Ingredient name required'),
  body('ingredients.*.quantity').isFloat({ min: 0 }).withMessage('Quantity must be >= 0'),
  body('ingredients.*.unit').trim().notEmpty().withMessage('Unit required'),
  body('steps').isArray({ min: 1 }).withMessage('At least one step required'),
  body('steps.*').trim().notEmpty().withMessage('Steps cannot be empty'),
  body('dietLabels').optional().isArray()
    .custom((arr) => arr.every((l) => DIET_LABELS.includes(l)))
    .withMessage(`Diet labels must be from: ${DIET_LABELS.join(', ')}`),
  body('prepMinutes').optional().isInt({ min: 0 }),
  body('cookMinutes').optional().isInt({ min: 0 }),
  body('servings').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(DIFFICULTIES),
];

const updateRecipeValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('ingredients').optional().isArray({ min: 1 }),
  body('ingredients.*.name').optional().trim().notEmpty(),
  body('ingredients.*.quantity').optional().isFloat({ min: 0 }),
  body('ingredients.*.unit').optional().trim().notEmpty(),
  body('steps').optional().isArray({ min: 1 }),
  body('dietLabels').optional().isArray()
    .custom((arr) => arr.every((l) => DIET_LABELS.includes(l))),
  body('prepMinutes').optional().isInt({ min: 0 }),
  body('cookMinutes').optional().isInt({ min: 0 }),
  body('servings').optional().isInt({ min: 1 }),
  body('difficulty').optional().isIn(DIFFICULTIES),
];

const nutritionInfoValidator = [
  body('calories').optional().isFloat({ min: 0 }),
  body('protein').optional().isFloat({ min: 0 }),
  body('carbs').optional().isFloat({ min: 0 }),
  body('fat').optional().isFloat({ min: 0 }),
  body('fiber').optional().isFloat({ min: 0 }),
  body('sugar').optional().isFloat({ min: 0 }),
  body('sodium').optional().isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 500 }),
];

const listRecipesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('difficulty').optional().isIn(DIFFICULTIES),
];

module.exports = { createRecipeValidator, updateRecipeValidator, nutritionInfoValidator, listRecipesValidator };
