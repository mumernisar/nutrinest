const mongoose = require('mongoose');

const planDaySchema = new mongoose.Schema({
  day:      { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  breakfast:{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  lunch:    { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  dinner:   { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  snacks:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  notes:    { type: String, maxlength: 300 },
}, { _id: false });

const nutritionPlanSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 800 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { type: String, enum: ['general','weight-loss','muscle-gain','diabetic','heart-health','athletic'], default: 'general' },
  dietType:       { type: String, enum: ['balanced','vegan','vegetarian','keto','paleo','gluten-free','halal'], default: 'balanced' },
  durationWeeks:  { type: Number, required: true, min: 1, max: 52 },
  weeklyPlan:     [planDaySchema],
  dailyCalorieTarget: { type: Number, min: 0 },
  isPublished:    { type: Boolean, default: false },
}, { timestamps: true });

nutritionPlanSchema.index({ createdBy: 1 });
nutritionPlanSchema.index({ isPublished: 1 });
nutritionPlanSchema.index({ targetAudience: 1, dietType: 1 });

module.exports = mongoose.model('NutritionPlan', nutritionPlanSchema);
