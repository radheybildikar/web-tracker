const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url:       { type: String, required: true },
  domain:    { type: String, required: true },
  title:     { type: String, default: '' },
  favicon:   { type: String, default: '' },
  visitedAt: { type: Date, default: Date.now },
  duration:  { type: Number, default: 0 }, // seconds spent on page
}, { timestamps: true });

// Index for fast user+date queries
visitSchema.index({ user: 1, visitedAt: -1 });
visitSchema.index({ user: 1, domain: 1 });

module.exports = mongoose.model('Visit', visitSchema);
