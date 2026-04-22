const mongoose = require('mongoose');
const Recipe = require('./Recipe');

const reviewSchema = new mongoose.Schema({
  recipe:  { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:  { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 800 },
  flagged: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ recipe: 1, author: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (recipeId) {
  const stats = await this.aggregate([
    { $match: { recipe: recipeId } },
    { $group: { _id: '$recipe', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Recipe.findByIdAndUpdate(recipeId, { averageRating: Math.round(stats[0].avgRating * 10) / 10, ratingsCount: stats[0].count });
  } else {
    await Recipe.findByIdAndUpdate(recipeId, { averageRating: 0, ratingsCount: 0 });
  }
};

reviewSchema.post('save', function () { this.constructor.calcAverageRating(this.recipe); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) doc.constructor.calcAverageRating(doc.recipe); });

module.exports = mongoose.model('Review', reviewSchema);
