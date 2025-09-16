const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/responseFormatter');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json(
                formatErrorResponse('User with this email already exists', 'USER_EXISTS')
            );
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        // Remove password from response
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            favorites: user.favorites,
            createdAt: user.createdAt
        };

        res.status(201).json(
            formatSuccessResponse(
                { user: userResponse, token },
                'User registered successfully'
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.isActive) {
            return res.status(401).json(
                formatErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS')
            );
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json(
                formatErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS')
            );
        }

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        // Remove password from response
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            favorites: user.favorites,
            createdAt: user.createdAt
        };

        res.status(200).json(
            formatSuccessResponse(
                { user: userResponse, token },
                'Login successful'
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites', 'name category location');

        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            favorites: user.favorites,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json(
            formatSuccessResponse(userResponse, 'Profile retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile
};