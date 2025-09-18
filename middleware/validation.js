const Joi = require('joi');
const { formatErrorResponse } = require('../utils/responseFormatter');

// User registration validation
const validateUserRegistration = (req, res, next) => {
    const schema = Joi.object({
        firstName: Joi.string().min(2).max(50).required()
            .messages({
                'string.min': 'First name must be at least 2 characters',
                'string.max': 'First name cannot exceed 50 characters',
                'any.required': 'First name is required'
            }),
        lastName: Joi.string().min(2).max(50).required()
            .messages({
                'string.min': 'Last name must be at least 2 characters',
                'string.max': 'Last name cannot exceed 50 characters',
                'any.required': 'Last name is required'
            }),
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().min(6).required()
            .messages({
                'string.min': 'Password must be at least 6 characters',
                'any.required': 'Password is required'
            })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json(
            formatErrorResponse(error.details[0].message, 'VALIDATION_ERROR')
        );
    }

    next();
};

// User login validation
const validateUserLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required()
            .messages({
                'string.email': 'Please enter a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string().required()
            .messages({
                'any.required': 'Password is required'
            })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json(
            formatErrorResponse(error.details[0].message, 'VALIDATION_ERROR')
        );
    }

    next();
};

// Business validation
const validateBusiness = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required()
            .messages({
                'string.min': 'Business name must be at least 2 characters',
                'string.max': 'Business name cannot exceed 100 characters',
                'any.required': 'Business name is required'
            }),
        category: Joi.string().valid(
            'Hospitals', 'Import/Export', 'Restaurants', 'Retail', 'Services',
            'Technology', 'Education', 'Entertainment', 'Automotive', 'Real Estate',
            'Finance', 'Legal', 'Other'
        ).required()
            .messages({
                'any.only': 'Please select a valid category',
                'any.required': 'Business category is required'
            }),
        description: Joi.string().max(500).allow(''),
        location: Joi.string().min(5).required()
            .messages({
                'string.min': 'Location must be at least 5 characters',
                'any.required': 'Business location is required'
            }),
        coordinates: Joi.object({
            latitude: Joi.number().min(-90).max(90),
            longitude: Joi.number().min(-180).max(180)
        }).and('latitude', 'longitude'),
        phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).allow('')
            .messages({
                'string.pattern.base': 'Please enter a valid phone number'
            }),
        email: Joi.string().email().allow('')
            .messages({
                'string.email': 'Please enter a valid email address'
            }),
        website: Joi.string().uri().allow('')
            .messages({
                'string.uri': 'Please enter a valid website URL'
            }),
        specialOffers: Joi.string().max(200).allow(''),
        images: Joi.array().items(
            Joi.string().uri().pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
                .messages({
                    'string.pattern.base': 'Image must be a valid image URL (jpg, jpeg, png, gif, webp)'
                })
        )
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json(
            formatErrorResponse(error.details[0].message, 'VALIDATION_ERROR')
        );
    }

    next();
};

// Business update validation (partial updates allowed)
const validateBusinessUpdate = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100),
        category: Joi.string().valid(
            'Hospitals', 'Import/Export', 'Restaurants', 'Retail', 'Services',
            'Technology', 'Education', 'Entertainment', 'Automotive', 'Real Estate',
            'Finance', 'Legal', 'Other'
        ),
        description: Joi.string().max(500).allow(''),
        location: Joi.string().min(5),
        coordinates: Joi.object({
            latitude: Joi.number().min(-90).max(90),
            longitude: Joi.number().min(-180).max(180)
        }).and('latitude', 'longitude'),
        phone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).allow(''),
        email: Joi.string().email().allow(''),
        website: Joi.string().uri().allow(''),
        specialOffers: Joi.string().max(200).allow(''),
        images: Joi.array().items(
            Joi.string().uri().pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
        ),
        isActive: Joi.boolean()
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json(
            formatErrorResponse(error.details[0].message, 'VALIDATION_ERROR')
        );
    }

    next();
};

module.exports = {
    validateUserRegistration,
    validateUserLogin,
    validateBusiness,
    validateBusinessUpdate
};
