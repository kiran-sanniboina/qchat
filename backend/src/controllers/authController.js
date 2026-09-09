const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendPasswordResetCode, hasRealSmtpConfig } = require('../utils/mailer');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'qchat_quantum_jwt_secret_key_2026_super_safe',
    { expiresIn: '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected. Please add your MONGO_URI in Render Environment variables.'
      });
    }
    const { name, email, password, avatarUrl, statusBio, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default avatar if none provided
    const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      avatarUrl: defaultAvatar,
      statusBio: statusBio || 'Secured with Quantum Digital Signatures (QDS)',
      phone: phone || '',
      isOnline: true,
      lastSeen: new Date()
    });

    await user.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        publicIdentity: user.publicIdentity,
        avatarUrl: user.avatarUrl,
        statusBio: user.statusBio,
        phone: user.phone || '',
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        blockedUsers: user.blockedUsers || []
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message || 'Server error during registration.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected. Please add your MONGO_URI in Render Environment variables.'
      });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        publicIdentity: user.publicIdentity,
        avatarUrl: user.avatarUrl,
        statusBio: user.statusBio,
        phone: user.phone || '',
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        blockedUsers: user.blockedUsers || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        publicIdentity: req.user.publicIdentity,
        avatarUrl: req.user.avatarUrl,
        statusBio: req.user.statusBio,
        phone: req.user.phone || '',
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen,
        blockedUsers: req.user.blockedUsers || []
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching user.' });
  }
};

// Update user profile (name, statusBio, avatarUrl, phone)
exports.updateProfile = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { name, statusBio, avatarUrl, phone } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (statusBio !== undefined) updates.statusBio = statusBio.trim();
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    if (updates.name === '') {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUserId,
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = {
      id: updatedUser._id.toString(),
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      publicIdentity: updatedUser.publicIdentity,
      avatarUrl: updatedUser.avatarUrl,
      statusBio: updatedUser.statusBio,
      phone: updatedUser.phone || '',
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen,
      blockedUsers: updatedUser.blockedUsers || []
    };

    // Broadcast user update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', userData);
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message || 'Server error updating profile.' });
  }
};

// Search / list users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user._id;

    let filter = { _id: { $ne: currentUserId } };
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .limit(30)
      .sort({ name: 1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Error searching users.' });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: targetUserId } },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({
      message: 'User blocked successfully.',
      blockedUsers: updatedUser.blockedUsers
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error blocking user.' });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: targetUserId } },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({
      message: 'User unblocked successfully.',
      blockedUsers: updatedUser.blockedUsers
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error unblocking user.' });
  }
};

// Request password reset verification code
exports.forgotPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected. Please try again later.'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please provide your registered email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email address.' });
    }

    // Generate a secure 6-digit numeric OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Dispatch verification code to the registered email address
    const emailResult = await sendPasswordResetCode(user.email, resetCode, user.name);
    const isRealDelivered = !!(emailResult && emailResult.success && emailResult.isRealEmail);

    let infoMessage = `A 6-digit verification code has been sent to ${user.email}. Please check your inbox (and spam folder).`;
    if (!isRealDelivered) {
      infoMessage = emailResult?.error
        ? `Verification code generated for ${user.email} (Email service error: ${emailResult.error}).`
        : `Verification code generated for ${user.email}. Demonstration mode active.`;
    }

    return res.status(200).json({
      message: infoMessage,
      email: user.email,
      expiresInMinutes: 15,
      isRealEmail: isRealDelivered,
      previewUrl: emailResult?.previewUrl || null,
      devCode: isRealDelivered ? null : resetCode
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ error: error.message || 'Error processing password reset request.' });
  }
};

// Verify code and set new password
exports.resetPassword = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected. Please try again later.'
      });
    }

    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: 'Email address, 6-digit verification code, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Verify code match
    if (!user.resetPasswordCode || user.resetPasswordCode !== cleanCode) {
      return res.status(400).json({
        error: 'Invalid verification code. Please check the code sent to your email and try again.'
      });
    }

    // Verify expiration
    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        error: 'This verification code has expired. Please request a new code.'
      });
    }

    // Hash the new password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: 'Password has been successfully updated! You can now log in with your new password.',
      email: user.email
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({ error: error.message || 'Error updating password.' });
  }
};

