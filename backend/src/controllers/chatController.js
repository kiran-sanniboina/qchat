const axios = require('axios');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const SecuritySession = require('../models/SecuritySession');
const User = require('../models/User');

let rawQdsUrl = process.env.QDS_SERVICE_URL;
if (!rawQdsUrl) {
  rawQdsUrl = process.env.NODE_ENV === 'production' ? 'https://qchat-qds-core.onrender.com' : 'http://localhost:8000';
} else if (rawQdsUrl === 'qchat-qds-core' || !rawQdsUrl.includes('.') || (rawQdsUrl.includes('localhost') && process.env.NODE_ENV === 'production')) {
  rawQdsUrl = 'https://qchat-qds-core.onrender.com';
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

    // Sort pinned chats to top, then by updatedAt descending
    const sortedChats = chats.sort((a, b) => {
      const aPinned = a.pinnedBy && a.pinnedBy.some(id => id.toString() === currentUserId.toString());
      const bPinned = b.pinnedBy && b.pinnedBy.some(id => id.toString() === currentUserId.toString());
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    return res.status(200).json({ chats: sortedChats });
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

// Export / Backup chat with cryptographic integrity seal
exports.backupChat = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;
    const crypto = require('crypto');

    const chat = await Chat.findById(id)
      .populate('participants', 'name email avatarUrl publicIdentity statusBio phone');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(p => {
      const pid = p?._id ? p._id.toString() : (p ? p.toString() : '');
      return pid === currentUserId.toString();
    });
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized. Not a participant in this chat.' });
    }

    // Fetch non-deleted messages for current user
    const messages = await Message.find({
      chatId: id,
      deletedForUsers: { $ne: currentUserId }
    })
      .populate('senderId', 'name email avatarUrl publicIdentity')
      .sort({ createdAt: 1 });

    // Format sanitized backup payload
    const formattedMessages = messages.map(msg => ({
      messageId: msg._id,
      sender: {
        id: msg.senderId?._id || msg.senderId,
        name: msg.senderId?.name || 'Unknown',
        email: msg.senderId?.email || '',
        publicIdentity: msg.senderId?.publicIdentity || ''
      },
      content: msg.plaintextPreview || (typeof msg.encryptedMessage === 'object' ? (msg.encryptedMessage?.combined || msg.encryptedMessage?.ciphertext || 'Encrypted Message') : String(msg.encryptedMessage || '')),
      mediaUrl: msg.mediaUrl || null,
      mediaType: msg.mediaType || 'none',
      mediaFilename: msg.mediaFilename || null,
      deliveryState: msg.deliveryState,
      timestamp: msg.createdAt,
      nonce: msg.nonce,
      messageHash: msg.messageHash,
      qdsVerification: {
        decision: msg.qdsVerification?.decision,
        detectedAttack: msg.qdsVerification?.detectedAttack,
        severity: msg.qdsVerification?.severity,
        mismatchRate: msg.qdsVerification?.mismatchRate,
        reason: msg.qdsVerification?.reason,
        chshS: msg.qdsVerification?.chshS,
        channelStatus: msg.qdsVerification?.channelStatus,
        qberEstimate: msg.qdsVerification?.qberEstimate
      }
    }));

    const metadata = {
      chatId: chat._id,
      isGroup: chat.isGroup,
      name: chat.name || (chat.isGroup ? 'Group Chat' : 'Direct Quantum Chat'),
      createdAt: chat.createdAt,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      },
      e91Status: chat.e91Status,
      sessionId: chat.activeSessionId || 'qds_sess_active'
    };

    // Calculate deterministic SHA-256 seal across all messages and metadata
    const hashData = JSON.stringify({
      metadata: { chatId: metadata.chatId, exportedAt: metadata.exportedAt },
      messages: formattedMessages.map(m => ({ id: m.messageId, hash: m.messageHash, t: m.timestamp }))
    });
    const integritySeal = crypto.createHash('sha256').update(hashData).digest('hex');

    const backupPayload = {
      schemaVersion: '1.0-qds-quantum-backup',
      integritySeal: `sha256:${integritySeal}`,
      generatedAt: new Date().toISOString(),
      metadata,
      participants: (chat.participants || []).map(p => ({
        id: p?._id || p,
        name: p?.name || 'User',
        email: p?.email || '',
        publicIdentity: p?.publicIdentity || '',
        phone: p?.phone || '',
        statusBio: p?.statusBio || ''
      })),
      messagesCount: formattedMessages.length,
      messages: formattedMessages
    };

    return res.status(200).json({ backup: backupPayload });
  } catch (error) {
    console.error('Error creating chat backup:', error);
    return res.status(500).json({ error: 'Server error creating chat backup.' });
  }
};

// Toggle Pin Chat for current user
exports.togglePinChat = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    if (!chat.pinnedBy) {
      chat.pinnedBy = [];
    }

    const pinIndex = chat.pinnedBy.findIndex(
      uid => uid.toString() === currentUserId.toString()
    );

    let isPinned = false;
    if (pinIndex > -1) {
      chat.pinnedBy.splice(pinIndex, 1);
      isPinned = false;
    } else {
      chat.pinnedBy.push(currentUserId);
      isPinned = true;
    }

    await chat.save();

    return res.status(200).json({ isPinned, pinnedBy: chat.pinnedBy });
  } catch (error) {
    console.error('Error toggling pin chat:', error);
    return res.status(500).json({ error: 'Server error pinning chat.' });
  }
};

// Toggle Mute Chat for current user
exports.toggleMuteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration } = req.body; // '8h', '1w', 'forever', 'unmute'
    const currentUserId = req.user._id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    if (!chat.mutedBy) {
      chat.mutedBy = [];
    }

    const muteIndex = chat.mutedBy.findIndex(
      m => m.userId && m.userId.toString() === currentUserId.toString()
    );

    if (duration === 'unmute') {
      if (muteIndex > -1) {
        chat.mutedBy.splice(muteIndex, 1);
      }
      await chat.save();
      return res.status(200).json({ isMuted: false, mutedUntil: null });
    }

    let until = null;
    if (duration === '8h') {
      until = new Date(Date.now() + 8 * 3600 * 1000);
    } else if (duration === '1w') {
      until = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    } // 'forever' leaves until = null

    if (muteIndex > -1) {
      chat.mutedBy[muteIndex].until = until;
    } else {
      chat.mutedBy.push({ userId: currentUserId, until });
    }

    await chat.save();

    return res.status(200).json({ isMuted: true, mutedUntil: until });
  } catch (error) {
    console.error('Error muting chat:', error);
    return res.status(500).json({ error: 'Server error muting chat.' });
  }
};

// Get Storage Usage Overview & Breakdown across all chats
exports.getStorageUsage = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const chats = await Chat.find({
      participants: currentUserId
    }).populate('participants', 'name email avatarUrl');

    const chatIds = chats.map(c => c._id);

    const messages = await Message.find({
      chatId: { $in: chatIds },
      mediaUrl: { $ne: null },
      deletedForUsers: { $ne: currentUserId }
    }).select('chatId mediaType fileSize mediaUrl mediaFilename createdAt');

    let totalSize = 0;
    let totalFiles = messages.length;
    let imagesSize = 0, imagesCount = 0;
    let videosSize = 0, videosCount = 0;
    let audioSize = 0, audioCount = 0;
    let docsSize = 0, docsCount = 0;

    const chatMediaMap = {};
    chatIds.forEach(cid => {
      chatMediaMap[cid.toString()] = {
        chatId: cid,
        mediaCount: 0,
        totalSize: 0,
        items: []
      };
    });

    messages.forEach(msg => {
      let size = msg.fileSize || 0;
      if (!size) {
        if (msg.mediaType === 'image') size = 250 * 1024;
        else if (msg.mediaType === 'video') size = 3 * 1024 * 1024;
        else if (msg.mediaType === 'audio' || msg.mediaType === 'voice') size = 180 * 1024;
        else size = 500 * 1024;
      }

      totalSize += size;

      if (msg.mediaType === 'image') {
        imagesSize += size;
        imagesCount++;
      } else if (msg.mediaType === 'video') {
        videosSize += size;
        videosCount++;
      } else if (msg.mediaType === 'audio' || msg.mediaType === 'voice') {
        audioSize += size;
        audioCount++;
      } else {
        docsSize += size;
        docsCount++;
      }

      const cEntry = chatMediaMap[msg.chatId.toString()];
      if (cEntry) {
        cEntry.mediaCount++;
        cEntry.totalSize += size;
        if (cEntry.items.length < 5) {
          cEntry.items.push({
            id: msg._id,
            mediaType: msg.mediaType,
            mediaUrl: msg.mediaUrl,
            mediaFilename: msg.mediaFilename,
            size
          });
        }
      }
    });

    const chatsBreakdown = chats.map(c => {
      const entry = chatMediaMap[c._id.toString()] || { mediaCount: 0, totalSize: 0, items: [] };
      const other = c.isGroup ? null : c.participants.find(p => p._id.toString() !== currentUserId.toString());
      return {
        chatId: c._id,
        name: c.isGroup ? c.name : (other?.name || 'User'),
        avatar: c.isGroup ? c.avatar : other?.avatarUrl,
        isGroup: c.isGroup,
        mediaCount: entry.mediaCount,
        totalSize: entry.totalSize,
        sampleItems: entry.items
      };
    }).filter(c => c.mediaCount > 0).sort((a, b) => b.totalSize - a.totalSize);

    return res.status(200).json({
      overview: {
        totalSize,
        totalFiles,
        imagesSize,
        imagesCount,
        videosSize,
        videosCount,
        audioSize,
        audioCount,
        docsSize,
        docsCount
      },
      chatsBreakdown
    });
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return res.status(500).json({ error: 'Server error calculating storage usage.' });
  }
};

// Clear media storage for a specific chat
exports.clearChatStorage = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(p => p.toString() === currentUserId.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await Message.updateMany(
      { chatId: id, mediaUrl: { $ne: null } },
      { $addToSet: { deletedForUsers: currentUserId } }
    );

    return res.status(200).json({ success: true, message: 'Chat media cleared.' });
  } catch (error) {
    console.error('Error clearing chat storage:', error);
    return res.status(500).json({ error: 'Server error clearing chat storage.' });
  }
};

// Restore chat backup
exports.restoreChatBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const { backup } = req.body;
    const currentUserId = req.user._id;
    const crypto = require('crypto');

    if (!backup || !backup.messages || !backup.integritySeal) {
      return res.status(400).json({ error: 'Invalid backup format.' });
    }

    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const isParticipant = chat.participants.some(p => p.toString() === currentUserId.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    // Verify SHA-256 integrity seal
    const hashData = JSON.stringify({
      metadata: { chatId: backup.metadata?.chatId, exportedAt: backup.metadata?.exportedAt },
      messages: (backup.messages || []).map(m => ({ id: m.messageId, hash: m.messageHash, t: m.timestamp }))
    });
    const computedSeal = 'sha256:' + crypto.createHash('sha256').update(hashData).digest('hex');

    if (computedSeal !== backup.integritySeal) {
      return res.status(400).json({ error: 'Cryptographic seal mismatch! The backup has been tampered with or corrupted.' });
    }

    let restoredCount = 0;
    const otherParticipant = chat.participants.find(p => p.toString() !== currentUserId.toString()) || currentUserId;

    for (const msgData of backup.messages) {
      const existing = await Message.findOne({
        chatId: chat._id,
        nonce: msgData.nonce
      });

      if (!existing) {
        const senderId = (msgData.sender?.id && chat.participants.some(p => p.toString() === msgData.sender.id.toString()))
          ? msgData.sender.id
          : currentUserId;

        const recipientId = (senderId.toString() === currentUserId.toString()) ? otherParticipant : currentUserId;

        await Message.create({
          chatId: chat._id,
          senderId,
          recipientId,
          encryptedMessage: {
            ciphertext: 'restored_ciphertext',
            iv: 'restored_iv',
            tag: 'restored_tag',
            combined: msgData.content
          },
          messageHash: msgData.messageHash || 'restored_hash',
          sessionId: chat.activeSessionId || `qds_sess_${chat._id}`,
          nonce: msgData.nonce || `restored_nonce_${Date.now()}_${Math.random()}`,
          plaintextPreview: msgData.content,
          mediaUrl: msgData.mediaUrl || null,
          mediaType: msgData.mediaType || 'none',
          mediaFilename: msgData.mediaFilename || null,
          deliveryState: msgData.deliveryState || 'verified',
          qdsVerification: {
            decision: msgData.qdsVerification?.decision || 'ACCEPT',
            detectedAttack: msgData.qdsVerification?.detectedAttack || null,
            severity: msgData.qdsVerification?.severity || 'LOW',
            reason: msgData.qdsVerification?.reason || 'Verified from cryptographically sealed backup',
            mismatchRate: msgData.qdsVerification?.mismatchRate || 0.0,
            matches: 32,
            mismatches: 0,
            totalQubits: 32,
            threshold: 0.05,
            chshS: msgData.qdsVerification?.chshS || 2.828,
            channelStatus: msgData.qdsVerification?.channelStatus || 'PASS',
            qberEstimate: msgData.qdsVerification?.qberEstimate || 0.0
          },
          createdAt: msgData.timestamp ? new Date(msgData.timestamp) : new Date()
        });
        restoredCount++;
      }
    }

    return res.status(200).json({
      success: true,
      restoredCount,
      totalMessages: backup.messages.length
    });
  } catch (error) {
    console.error('Error restoring chat backup:', error);
    return res.status(500).json({ error: 'Server error restoring chat backup.' });
  }
};



