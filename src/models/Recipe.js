const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Ingredient name is required'], trim: true },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
  unit:     { type: String, required: [true, 'Unit is required'], trim: true },
}, { _id: false });

const nutritionInfoSchema = new mongoose.Schema({
  calories: { type: Number, min: 0 },
  protein:  { type: Number, min: 0 },
  carbs:    { type: Number, min: 0 },
  fat:      { type: Number, min: 0 },
  fiber:    { type: Number, min: 0 },
  sugar:    { type: Number, min: 0 },
  sodium:   { type: Number, min: 0 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  notes:    { type: String, maxlength: 500 },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: {
    type: String, required: [true, 'Recipe title is required'], trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 1000 },
  author:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ingredients: {
    type: [ingredientSchema],
    validate: { validator: (arr) => arr.length >= 1, message: 'At least one ingredient is required' },
  },
  steps: {
    type: [{ type: String, trim: true }],
    validate: { validator: (arr) => arr.length >= 1, message: 'At least one step is required' },
  },
  tags:       [{ type: String, trim: true, lowercase: true }],
  dietLabels: [{ type: String, enum: ['vegan','vegetarian','gluten-free','dairy-free','keto','paleo','halal','low-sodium','high-protein'] }],
  prepMinutes:    { type: Number, min: 0, default: 0 },
  cookMinutes:    { type: Number, min: 0, default: 0 },
  servings:       { type: Number, min: 1, default: 1 },
  difficulty:     { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  nutritionInfo:  nutritionInfoSchema,
  isPublished:    { type: Boolean, default: false },
  isVerified:     { type: Boolean, default: false },
  flagged:        { type: Boolean, default: false },
  flagReason:     String,
  averageRating:  { type: Number, default: 0, min: 0, max: 5 },
  ratingsCount:   { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ isPublished: 1, isVerified: 1 });
recipeSchema.index({ author: 1 });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ dietLabels: 1 });

recipeSchema.virtual('totalMinutes').get(function () {
  return (this.prepMinutes || 0) + (this.cookMinutes || 0);
});

module.exports = mongoose.model('Recipe', recipeSchema);
