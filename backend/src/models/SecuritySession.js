const mongoose = require('mongoose');

const securitySessionSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  e91Result: {
    chshS: { type: Number, required: true },
    absS: { type: Number, required: true },
    channelStatus: { type: String, enum: ['PASS', 'SUSPICIOUS', 'FAIL'], required: true },
    qberEstimate: { type: Number, required: true },
    correlations: { type: mongoose.Schema.Types.Mixed, default: {} },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  keyMaterialRef: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SecuritySession', securitySessionSchema);

