const express = require('express');
const router  = express.Router();
const recipeController = require('../controllers/recipe.controller');
const reviewController = require('../controllers/review.controller');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRecipeValidator, updateRecipeValidator,
        nutritionInfoValidator, listRecipesValidator } = require('../validators/recipe.validators');

router.get('/',                listRecipesValidator, validate, optionalAuth, recipeController.listRecipes);
router.get('/unverified',      protect, restrictTo('nutritionist','admin'), recipeController.listUnverified);
router.get('/my',              protect, recipeController.getMyRecipes);
router.get('/admin/all',       protect, restrictTo('admin'), recipeController.adminListRecipes);
router.get('/:recipeId',       optionalAuth, recipeController.getRecipe);

router.post('/',               protect, createRecipeValidator, validate, recipeController.createRecipe);
router.patch('/:recipeId',     protect, updateRecipeValidator, validate, recipeController.updateRecipe);
router.delete('/:recipeId',    protect, recipeController.deleteRecipe);

router.patch('/:recipeId/publish', protect, restrictTo('admin'), recipeController.togglePublish);
router.patch('/:recipeId/flag',    protect, restrictTo('admin'), recipeController.flagRecipe);

router.put('/:recipeId/nutrition',
  protect, restrictTo('nutritionist','admin'), nutritionInfoValidator, validate, recipeController.addNutritionInfo);

router.get('/:recipeId/reviews',               optionalAuth, reviewController.listReviews);
router.post('/:recipeId/reviews',              protect, reviewController.createReview);
router.patch('/:recipeId/reviews/:reviewId',   protect, reviewController.updateReview);
router.delete('/:recipeId/reviews/:reviewId',  protect, reviewController.deleteReview);

module.exports = router;
