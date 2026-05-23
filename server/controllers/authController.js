const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const { sendOTPEmail, sendResetPasswordEmail } = require('../utils/mailer');

// OTP functionality temporarily disabled for future release
// const { generateOTP, hashOTP, verifyOTP } = require('../utils/otp');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role, isVerified: u.isVerified,
});

// ── POST /api/auth/register ────────────────────────────────────────────────────
// OTP functionality temporarily disabled for future release
// Registration now completes immediately without OTP verification
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email });
    if (exists && exists.isVerified)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    let user;
    if (exists && !exists.isVerified) {
      // Overwrite previous unverified registration
      exists.name     = name;
      exists.password = password;
      // OTP functionality temporarily disabled for future release
      // exists.otp        = otpHash;
      // exists.otpExpiry  = otpExpiry;
      // exists.otpAttempts = 0;
      exists.isVerified = true; // OTP temporarily disabled — mark verified immediately
      user = await exists.save();
    } else {
      // OTP functionality temporarily disabled for future release — isVerified set to true directly
      user = await User.create({ name, email, password, isVerified: true });
    }

    // OTP functionality temporarily disabled for future release
    // await sendOTPEmail({ to: email, name, otp });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to RentFlux!',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
// OTP functionality temporarily disabled for future release
exports.verifyOTP = async (req, res) => {
  // OTP functionality temporarily disabled for future release
  res.status(503).json({
    success: false,
    message: 'OTP verification is temporarily disabled.',
  });
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
// OTP functionality temporarily disabled for future release
exports.resendOTP = async (req, res) => {
  // OTP functionality temporarily disabled for future release
  res.status(503).json({
    success: false,
    message: 'OTP resend is temporarily disabled.',
  });
};

// ── POST /api/auth/login ───────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // OTP functionality temporarily disabled for future release
    // isVerified check kept but all accounts are auto-verified during registration now
    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please contact support.',
      });

    const token = signToken(user._id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── PUT /api/auth/password ─────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Sends a password reset link with a secure token to the user's email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });

    // Always respond with success to prevent email enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // Generate secure random token
    const resetToken   = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry  = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.passwordResetToken  = resetTokenHash;
    user.passwordResetExpiry = resetExpiry;
    await user.save({ validateBeforeSave: false });

    // Build reset URL — use client URL from env or fallback
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl  = `${clientUrl}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail({ to: email, name: user.name, resetUrl, expiry: '15 minutes' });
    } catch (emailErr) {
      // If email fails, clear the token so user can retry
      user.passwordResetToken  = undefined;
      user.passwordResetExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Reset email error:', emailErr);
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }

    res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── POST /api/auth/reset-password/:token ──────────────────────────────────────
// Validates token and sets new password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    // Hash the incoming raw token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:  tokenHash,
      passwordResetExpiry: { $gt: new Date() }, // not expired
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });

    // Set new password and clear reset token (single-use)
    user.password            = password;
    user.passwordResetToken  = undefined;
    user.passwordResetExpiry = undefined;
    user.isVerified          = true; // ensure account is active
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
