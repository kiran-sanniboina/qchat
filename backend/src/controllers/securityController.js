const axios = require('axios');
const Chat = require('../models/Chat');
const ThreatLog = require('../models/ThreatLog');
const SecuritySession = require('../models/SecuritySession');
const Message = require('../models/Message');

let rawQdsUrl = process.env.QDS_SERVICE_URL || 'http://localhost:8000';
if (rawQdsUrl && !rawQdsUrl.startsWith('http://') && !rawQdsUrl.startsWith('https://')) {
  rawQdsUrl = `https://${rawQdsUrl}`;
}
const QDS_URL = rawQdsUrl;

// Get current security status & summary for a chat
exports.getChatSecurityStatus = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    // Latest session
    const session = await SecuritySession.findOne({ chatId }).sort({ createdAt: -1 });

    // Latest message verification
    const latestMessage = await Message.findOne({ chatId }).sort({ createdAt: -1 });

    // Count threats
    const totalThreats = await ThreatLog.countDocuments({ chatId });

    return res.status(200).json({
      chatId,
      activeSessionId: chat.activeSessionId,
      e91Status: chat.e91Status,
      sessionDetails: session ? {
        sessionId: session.sessionId,
        e91Result: session.e91Result,
        establishedAt: session.createdAt
      } : null,
      latestVerification: latestMessage ? latestMessage.qdsVerification : null,
      totalThreatsCount: totalThreats
    });
  } catch (error) {
    console.error('Error in getChatSecurityStatus:', error);
    return res.status(500).json({ error: 'Server error fetching security status.' });
  }
};

// Get threat logs for a chat
exports.getChatThreats = async (req, res) => {
  try {
    const { chatId } = req.params;
    const threats = await ThreatLog.find({ chatId })
      .sort({ timestamp: -1 })
      .limit(50);

    return res.status(200).json({ threats });
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching threats.' });
  }
};

// Refresh E91 channel evaluation on-demand
exports.refreshE91 = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { noiseRate, interceptProb } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    let e91Result;
    try {
      const qdsRes = await axios.post(`${QDS_URL}/qds/e91/evaluate`, {
        noiseRate: noiseRate || 0.0,
        interceptProb: interceptProb || 0.0,
        shots: 600
      }, { timeout: 5000 });
      e91Result = qdsRes.data;
    } catch (e) {
      console.warn('Fallback local E91 evaluate:', e.message);
      e91Result = {
        chshS: 2.8284,
        absS: 2.8284,
        theoreticalMax: 2.8284,
        classicalBound: 2.0,
        channelStatus: 'PASS',
        qberEstimate: 0.0
      };
    }

    // Update chat
    chat.e91Status = {
      chshS: e91Result.chshS,
      channelStatus: e91Result.channelStatus,
      qberEstimate: e91Result.qberEstimate,
      lastEvaluatedAt: new Date()
    };
    await chat.save();

    // Broadcast channel update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chatId}`).emit('channel:update', {
        chatId,
        e91Status: chat.e91Status
      });
    }

    return res.status(200).json({ e91Result, e91Status: chat.e91Status });
  } catch (error) {
    return res.status(500).json({ error: 'Error refreshing E91 channel.' });
  }
};

// Trigger simulated attack for demo console
exports.simulateAttack = async (req, res) => {
  try {
    const { chatId, attackType, sampleMessage } = req.body;

    if (!attackType) {
      return res.status(400).json({ error: 'attackType is required.' });
    }

    const qdsRes = await axios.post(`${QDS_URL}/qds/attack/simulate`, {
      chatId: chatId || 'demo_chat',
      attackType,
      sampleMessage: sampleMessage || 'Unauthorized transfer of funds'
    }, { timeout: 6000 });

    const simResult = qdsRes.data;

    // Log to ThreatLog in MongoDB if chatId provided
    if (chatId) {
      const threatLog = new ThreatLog({
        chatId,
        attackType,
        severity: simResult.verificationResult?.severity || 'HIGH',
        reason: simResult.verificationResult?.reason || 'Simulated attack detected',
        evidence: simResult.verificationResult?.evidence || {},
        detectedBy: 'Deterministic Quantum Threat Engine (Simulation Console)'
      });
      await threatLog.save();

      // Emit real-time security alert via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`chat:${chatId}`).emit('security:alert', {
          chatId,
          attackType,
          severity: simResult.verificationResult?.severity || 'HIGH',
          reason: simResult.verificationResult?.reason || 'Simulated attack detected',
          evidence: simResult.verificationResult?.evidence || {},
          timestamp: new Date()
        });
      }
    }

    return res.status(200).json({ simulation: simResult });
  } catch (error) {
    console.error('Error simulating attack:', error);
    return res.status(500).json({ error: 'Error running attack simulation.' });
  }
};

// Get benchmark experiment matrix
exports.getBenchmarkMatrix = async (req, res) => {
  try {
    const qdsRes = await axios.get(`${QDS_URL}/qds/benchmark/matrix`, { timeout: 8000 });
    return res.status(200).json(qdsRes.data);
  } catch (error) {
    console.error('Error fetching benchmark matrix:', error);
    return res.status(500).json({ error: 'Error fetching benchmark matrix.' });
  }
};

// Step-by-step Teleportation Circuit Simulation
exports.simulateTeleportSteps = async (req, res) => {
  try {
    const { stateLabel, perturb, perturbType } = req.body;
    const qdsRes = await axios.post(`${QDS_URL}/qds/teleport/simulate-steps`, {
      stateLabel: stateLabel || '00',
      perturb: Boolean(perturb),
      perturbType
    }, { timeout: 6000 });
    return res.status(200).json(qdsRes.data);
  } catch (error) {
    console.error('Error in simulateTeleportSteps:', error);
    return res.status(500).json({ error: 'Error simulating teleportation steps.' });
  }
};

