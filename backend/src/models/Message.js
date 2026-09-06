const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  encryptedMessage: {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    combined: { type: String }
  },
  messageHash: {
    type: String,
    required: true
  },
  signatureMeta: {
    qubitCount: { type: Number, default: 32 },
    teleportationRecords: { type: Array, default: [] },
    threshold: { type: Number, default: 0.05 }
  },
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
  plaintextPreview: {
    type: String,
    default: ''
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['none', 'image', 'audio', 'document'],
    default: 'none'
  },
  mediaFilename: {
    type: String,
    default: null
  },
  deliveryState: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'verified', 'rejected'],
    default: 'sent',
    index: true
  },
  qdsVerification: {
    decision: { type: String, enum: ['ACCEPT', 'REJECT', 'PENDING'], default: 'PENDING' },
    detectedAttack: { type: String, default: null },
    severity: { type: String, default: 'LOW' },
    reason: { type: String, default: '' },
    mismatchRate: { type: Number, default: 0.0 },
    matches: { type: Number, default: 0 },
    mismatches: { type: Number, default: 0 },
    totalQubits: { type: Number, default: 32 },
    threshold: { type: Number, default: 0.05 },
    chshS: { type: Number, default: 2.828 },
    channelStatus: { type: String, default: 'PASS' },
    qberEstimate: { type: Number, default: 0.0 },
    identityStatus: { type: String, default: 'VALID' },
    nonceStatus: { type: String, default: 'VALID' },
    authorizationStatus: { type: String, default: 'AUTHORIZED' },
    evidence: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  isDeletedForEveryone: {
    type: Boolean,
    default: false
  },
  deletedForUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);

