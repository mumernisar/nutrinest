const mongoose = require('mongoose');

const mealSlotSchema = new mongoose.Schema({
  day:      { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  meal:     { type: String, enum: ['breakfast','lunch','dinner','snack'], required: true },
  recipe:   { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  servings: { type: Number, min: 1, default: 1 },
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  name:      { type: String, required: [true, 'Plan name is required'], trim: true, maxlength: 80 },
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: {
    type: Date, required: [true, 'weekStart is required'],
    validate: { validator: (d) => d.getDay() === 1, message: 'weekStart must be a Monday' },
  },
  slots: [mealSlotSchema],
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });

mealPlanSchema.index({ owner: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
