const User = require('../models/User');
const Business = require('../models/Business');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).populate('favorites', 'name category location');

        if (!user || !user.isActive) {
            return res.status(404).json(
                formatErrorResponse('User not found', 'USER_NOT_FOUND')
            );
        }

        // Only return public info unless it's the user themselves or an admin
        const isOwnerOrAdmin = req.user && (req.user._id.equals(user._id) || req.user.role === 'admin');

        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            ...(isOwnerOrAdmin && {
                email: user.email,
                favorites: user.favorites,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            })
        };

        res.status(200).json(
            formatSuccessResponse(userResponse, 'User retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;

        // Check if user exists
        const user = await User.findById(id);
        if (!user || !user.isActive) {
            return res.status(404).json(
                formatErrorResponse('User not found', 'USER_NOT_FOUND')
            );
        }

        // Check authorization (user can only update their own profile, unless admin)
        if (!req.user._id.equals(user._id) && req.user.role !== 'admin') {
            return res.status(403).json(
                formatErrorResponse('Not authorized to update this profile', 'UNAUTHORIZED')
            );
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json(
                    formatErrorResponse('Email already in use', 'EMAIL_EXISTS')
                );
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { firstName, lastName, email },
            { new: true, runValidators: true }
        ).populate('favorites', 'name category location');

        const userResponse = {
            id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            favorites: updatedUser.favorites,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        res.status(200).json(
            formatSuccessResponse(userResponse, 'Profile updated successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Add business to favorites
 * POST /api/users/:id/favorites
 */
const addToFavorites = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { businessId } = req.body;

        // Check authorization
        if (!req.user._id.equals(id)) {
            return res.status(403).json(
                formatErrorResponse('Not authorized to modify favorites', 'UNAUTHORIZED')
            );
        }

        // Check if business exists
        const business = await Business.findById(businessId);
        if (!business || !business.isActive) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        // Get user and add to favorites
        const user = await User.findById(id);
        if (!user || !user.isActive) {
            return res.status(404).json(
                formatErrorResponse('User not found', 'USER_NOT_FOUND')
            );
        }

        // Check if already in favorites
        if (user.favorites.includes(businessId)) {
            return res.status(400).json(
                formatErrorResponse('Business already in favorites', 'ALREADY_FAVORITE')
            );
        }

        // Add to favorites
        await user.addToFavorites(businessId);

        // Update business favorite count
        business.favoriteCount += 1;
        await business.save();

        // Return updated favorites
        const updatedUser = await User.findById(id).populate('favorites', 'name category location');

        res.status(200).json(
            formatSuccessResponse(updatedUser.favorites, 'Business added to favorites')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Remove business from favorites
 * DELETE /api/users/:id/favorites/:businessId
 */
const removeFromFavorites = async (req, res, next) => {
    try {
        const { id, businessId } = req.params;

        // Check authorization
        if (!req.user._id.equals(id)) {
            return res.status(403).json(
                formatErrorResponse('Not authorized to modify favorites', 'UNAUTHORIZED')
            );
        }

        // Get user
        const user = await User.findById(id);
        if (!user || !user.isActive) {
            return res.status(404).json(
                formatErrorResponse('User not found', 'USER_NOT_FOUND')
            );
        }

        // Check if business is in favorites
        if (!user.favorites.includes(businessId)) {
            return res.status(404).json(
                formatErrorResponse('Business not in favorites', 'NOT_FAVORITE')
            );
        }

        // Remove from favorites
        await user.removeFromFavorites(businessId);

        // Update business favorite count
        const business = await Business.findById(businessId);
        if (business) {
            business.favoriteCount = Math.max(0, business.favoriteCount - 1);
            await business.save();
        }

        // Return updated favorites
        const updatedUser = await User.findById(id).populate('favorites', 'name category location');

        res.status(200).json(
            formatSuccessResponse(updatedUser.favorites, 'Business removed from favorites')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (Admin only)
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find({ isActive: true })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({ isActive: true });

        const usersResponse = users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            favoritesCount: user.favorites.length,
            createdAt: user.createdAt
        }));

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: usersResponse,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUserById,
    updateUser,
    addToFavorites,
    removeFromFavorites,
    getAllUsers
};