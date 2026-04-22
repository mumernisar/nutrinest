const express = require('express');
const router  = express.Router();
const nutritionPlanController = require('../controllers/nutritionPlan.controller');
const { protect, restrictTo } = require('../middleware/auth');
const validate                = require('../middleware/validate');
const { createNutritionPlanValidator } = require('../validators/nutritionPlan.validators');

router.get('/',        nutritionPlanController.listPlans);
router.get('/my',      protect, restrictTo('nutritionist','admin'), nutritionPlanController.getMyPlans);
router.get('/:planId', nutritionPlanController.getPlan);

router.post('/',
  protect, restrictTo('nutritionist','admin'), createNutritionPlanValidator, validate, nutritionPlanController.createPlan);
router.patch('/:planId',
  protect, restrictTo('nutritionist','admin'), nutritionPlanController.updatePlan);
router.delete('/:planId',
  protect, restrictTo('nutritionist','admin'), nutritionPlanController.deletePlan);
router.patch('/:planId/publish',
  protect, restrictTo('nutritionist','admin'), nutritionPlanController.togglePublish);

module.exports = router;
