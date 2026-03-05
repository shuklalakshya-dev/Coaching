const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Login user (admin or student)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account has been deactivated. Contact admin.', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorResponse('New password must be at least 6 characters', 400));
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
};

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      class: user.class,
      rollNumber: user.rollNumber,
    },
  });
};

module.exports = { login, getMe, changePassword };
