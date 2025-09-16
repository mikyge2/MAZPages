const { formatErrorResponse } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        return res.status(404).json(formatErrorResponse(message, 'RESOURCE_NOT_FOUND'));
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        return res.status(400).json(formatErrorResponse(message, 'DUPLICATE_RESOURCE'));
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json(formatErrorResponse(message, 'VALIDATION_ERROR'));
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        return res.status(401).json(formatErrorResponse(message, 'AUTHENTICATION_ERROR'));
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        return res.status(401).json(formatErrorResponse(message, 'AUTHENTICATION_ERROR'));
    }

    // Default error
    res.status(error.statusCode || 500).json(
        formatErrorResponse(error.message || 'Server Error', 'SERVER_ERROR')
    );
};

module.exports = errorHandler;
