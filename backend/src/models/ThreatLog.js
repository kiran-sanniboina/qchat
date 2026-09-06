const mongoose = require('mongoose');

const threatLogSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  attackType: {
    type: String,
    enum: [
      'FORGERY',
      'REPLAY',
      'IMPERSONATION',
      'CHANNEL_MANIPULATION',
      'PASSIVE_EAVESDROP',
      'UNAUTHORIZED_VERIFICATION',
      'TAMPERING'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  reason: {
    type: String,
    default: ''
  },
  evidence: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  detectedBy: {
    type: String,
    default: 'Deterministic Quantum Threat Engine'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ThreatLog', threatLogSchema);

