const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  totalQty: { type: Number, required: true, min: 0 },
  unit:     { type: String, required: true, trim: true },
  checked:  { type: Boolean, default: false },
}, { _id: false });

const shoppingListSchema = new mongoose.Schema({
  mealPlan:    { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan', required: true },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:       [shoppingItemSchema],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

shoppingListSchema.index({ mealPlan: 1 }, { unique: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
