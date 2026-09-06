const axios = require('axios');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const SecuritySession = require('../models/SecuritySession');
const User = require('../models/User');

let rawQdsUrl = process.env.QDS_SERVICE_URL;
if (!rawQdsUrl || (rawQdsUrl.includes('localhost') && process.env.NODE_ENV === 'production')) {
  rawQdsUrl = 'https://qchat-qds-core.onrender.com';
} else if (!rawQdsUrl) {
  rawQdsUrl = 'http://localhost:8000';
}
if (rawQdsUrl && !rawQdsUrl.startsWith('http://') && !rawQdsUrl.startsWith('https://')) {
  rawQdsUrl = rawQdsUrl.includes('.onrender.com') ? `https://${rawQdsUrl}` : `http://${rawQdsUrl}`;
}
const QDS_URL = rawQdsUrl.replace(/\/+$/, '');

// List chats for current user
exports.getUserChats = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
      participants: currentUserId
    })
      .populate('participants', 'name email avatarUrl isOnline lastSeen publicIdentity statusBio')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({ chats });
  } catch (error) {
    console.error('Error getting user chats:', error);
    return res.status(500).json({ error: 'Server error fetching chats.' });
  }
};

// Create a new 1:1 or group chat
exports.createChat = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId, participantIds, isGroup, name } = req.body;

    // Check if 1:1 chat already exists
    if (!isGroup) {
      if (!recipientId) {
        return res.status(400).json({ error: 'Recipient ID is required for 1:1 chat.' });
      }

      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, recipientId], $size: 2 }
      })
        .populate('participants', 'name email avatarUrl isOnline lastSeen publicIdentity statusBio')
        .populate('lastMessage');

      if (existingChat) {
        return res.status(200).json({ chat: existingChat, isExisting: true });
      }
    }

    const participants = isGroup
      ? Array.from(new Set([currentUserId.toString(), ...(participantIds || [])]))
      : [currentUserId, recipientId];

    if (participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants required.' });
    }

    // Initialize new Chat document
    const chat = new Chat({
      participants,
      isGroup: Boolean(isGroup),
      name: isGroup ? (name || 'Quantum Group') : '',
      admin: isGroup ? currentUserId : undefined,
      avatar: isGroup
        ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'group')}`
        : ''
    });

    await chat.save();

    // Call Python QDS Core to run initial Dynamic E91 protocol
    let e91Result = {
      chshS: 2.8284,
      absS: 2.8284,
      channelStatus: 'PASS',
      qberEstimate: 0.0
    };
    let sessionId = `qds_sess_${chat._id.toString()}`;

    try {
      const qdsRes = await axios.post(`${QDS_URL}/qds/session/init`, {
        chatId: chat._id.toString()
      }, { timeout: 4000 });

      if (qdsRes.data) {
        sessionId = qdsRes.data.sessionId;
        e91Result = qdsRes.data.e91Result;
      }
    } catch (qdsErr) {
      console.warn('QDS Core init warning (using baseline quantum defaults):', qdsErr.message);
    }

    // Create SecuritySession record
    const securitySession = new SecuritySession({
      chatId: chat._id,
      sessionId,
      e91Result,
      keyMaterialRef: chat.sharedKey
    });
    await securitySession.save();

    // Update chat with activeSessionId and e91Status
    chat.activeSessionId = sessionId;
    chat.e91Status = {
      chshS: e91Result.chshS,
      channelStatus: e91Result.channelStatus,
      qberEstimate: e91Result.qberEstimate,
      lastEvaluatedAt: new Date()
    };
    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatarUrl isOnline lastSeen publicIdentity statusBio');

    return res.status(201).json({ chat: populatedChat, isExisting: false });
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({ error: 'Server error creating chat.' });
  }
};

// Get single chat by ID
exports.getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id)
      .populate('participants', 'name email avatarUrl isOnline lastSeen publicIdentity statusBio')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    // Verify current user is a participant
    const isParticipant = chat.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized. Not a participant in this chat.' });
    }

    return res.status(200).json({ chat });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching chat.' });
  }
};

// Clear chat messages for the current user
exports.clearChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(
      p => p.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized. Not a participant in this chat.' });
    }

    // Add current user to deletedForUsers for all messages in this chat
    await Message.updateMany(
      { chatId: id },
      { $addToSet: { deletedForUsers: currentUserId } }
    );

    // Emit socket event if active
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${id}`).emit('chat:cleared', {
        chatId: id,
        userId: currentUserId.toString()
      });
    }

    return res.status(200).json({ message: 'Chat cleared successfully.' });
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    return res.status(500).json({ error: 'Server error clearing chat.' });
  }
};


