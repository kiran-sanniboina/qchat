const mongoose = require('mongoose');

const nonceRegistrySchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  nonce: {
    type: String,
    required: true,
    index: true
  },
  consumedAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Automatically expire nonces after 24h
  }
}, {
  timestamps: true
});

// Compound unique index ensuring no nonce can ever be reused in a given session
nonceRegistrySchema.index({ sessionId: 1, nonce: 1 }, { unique: true });

module.exports = mongoose.model('NonceRegistry', nonceRegistrySchema);

