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
    enum: ['none', 'image', 'video', 'audio', 'voice', 'document', 'location', 'contact', 'sticker', 'gif'],
    default: 'none'
  },
  mediaFilename: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    senderName: { type: String, default: '' },
    textPreview: { type: String, default: '' },
    mediaType: { type: String, default: 'none' }
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, default: '' },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  starredBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  locationData: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' },
    name: { type: String, default: '' }
  },
  contactData: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    avatarUrl: { type: String, default: '' }
  },
  isForwarded: {
    type: Boolean,
    default: false
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

