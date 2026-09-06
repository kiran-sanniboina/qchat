const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  publicIdentity: {
    type: String,
    default: function() {
      return 'pk_' + Math.random().toString(36).substring(2, 15);
    }
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  statusBio: {
    type: String,
    default: 'Hey there! I am using QChat with Quantum Digital Signatures.',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

