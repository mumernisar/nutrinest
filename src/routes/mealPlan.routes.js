const express = require('express');
const router  = express.Router();
const mealPlanController = require('../controllers/mealPlan.controller');
const { protect }        = require('../middleware/auth');
const validate           = require('../middleware/validate');
const { createMealPlanValidator, mealSlotValidator } = require('../validators/mealPlan.validators');

router.use(protect);

router.get('/',    mealPlanController.listMealPlans);
router.post('/',   createMealPlanValidator, validate, mealPlanController.createMealPlan);

router.get('/:planId',    mealPlanController.getMealPlan);
router.patch('/:planId',  mealPlanController.updateMealPlan);
router.delete('/:planId', mealPlanController.deleteMealPlan);

router.put('/:planId/slots',    mealSlotValidator, validate, mealPlanController.upsertSlot);
router.delete('/:planId/slots', mealPlanController.removeSlot);

router.post('/:planId/shopping-list',        mealPlanController.generateShoppingList);
router.get('/:planId/shopping-list',         mealPlanController.getShoppingList);
router.patch('/:planId/shopping-list/toggle',mealPlanController.toggleShoppingItem);

module.exports = router;
