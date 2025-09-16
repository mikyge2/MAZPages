const express = require('express');
const {
    getUserById,
    updateUser,
    addToFavorites,
    removeFromFavorites,
    getAllUsers
} = require('../controllers/userController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authenticate, requireAdmin, getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public (limited info) / Private (full info for owner/admin)
router.get('/:id', optionalAuth, getUserById);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (owner or admin)
router.put('/:id', authenticate, updateUser);

// @route   POST /api/users/:id/favorites
// @desc    Add business to favorites
// @access  Private (owner only)
router.post('/:id/favorites', authenticate, addToFavorites);

// @route   DELETE /api/users/:id/favorites/:businessId
// @desc    Remove business from favorites
// @access  Private (owner only)
router.delete('/:id/favorites/:businessId', authenticate, removeFromFavorites);

module.exports = router;