const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { formatErrorResponse } = require('../utils/responseFormatter');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json(
                formatErrorResponse('Access denied. No token provided.', 'AUTHENTICATION_ERROR')
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user || !user.isActive) {
                return res.status(401).json(
                    formatErrorResponse('Invalid token. User not found.', 'AUTHENTICATION_ERROR')
                );
            }

            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).json(
                formatErrorResponse('Invalid token.', 'AUTHENTICATION_ERROR')
            );
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json(
            formatErrorResponse('Server error during authentication', 'SERVER_ERROR')
        );
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json(
            formatErrorResponse('Access denied. Admin privileges required.', 'AUTHORIZATION_ERROR')
        );
    }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);

                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (jwtError) {
                // Token is invalid, but we continue without authentication
                console.log('Optional auth: Invalid token provided');
            }
        }

        next();
    } catch (error) {
        console.error('Optional authentication middleware error:', error);
        next(); // Continue without authentication
    }
};

module.exports = {
    authenticate,
    requireAdmin,
    optionalAuth
};