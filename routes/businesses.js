const express = require('express');
const {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getCategories
} = require('../controllers/businessController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateBusiness, validateBusinessUpdate } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/businesses/categories
// @desc    Get all business categories with counts
// @access  Public
router.get('/categories', getCategories);

// @route   GET /api/businesses
// @desc    Get all businesses with search/filter/pagination
// @access  Public (with optional auth for favorites)
router.get('/', optionalAuth, getAllBusinesses);

// @route   GET /api/businesses/:id
// @desc    Get business by ID
// @access  Public (with optional auth for favorites)
router.get('/:id', optionalAuth, getBusinessById);

// @route   POST /api/businesses
// @desc    Create new business
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, validateBusiness, createBusiness);

// @route   PATCH /api/businesses/:id
// @desc    Update business
// @access  Private/Admin
router.patch('/:id', authenticate, requireAdmin, validateBusinessUpdate, updateBusiness);

// @route   DELETE /api/businesses/:id
// @desc    Delete business (soft delete)
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, deleteBusiness);

module.exports = router;