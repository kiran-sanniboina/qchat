const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    type: String,
    default: ''
  },
  sharedKey: {
    type: String,
    required: true,
    default: function() {
      // 256-bit hex symmetric key representation for the chat
      return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    }
  },
  activeSessionId: {
    type: String,
    default: ''
  },
  e91Status: {
    chshS: { type: Number, default: 2.828 },
    channelStatus: { type: String, enum: ['PASS', 'SUSPICIOUS', 'FAIL'], default: 'PASS' },
    qberEstimate: { type: Number, default: 0.0 },
    lastEvaluatedAt: { type: Date, default: Date.now }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  pinnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mutedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    until: {
      type: Date,
      default: null // null means forever
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', chatSchema);

