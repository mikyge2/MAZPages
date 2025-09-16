const Business = require('../models/Business');
const { formatSuccessResponse, formatErrorResponse, formatPaginatedResponse } = require('../utils/responseFormatter');

/**
 * Get all businesses with search and filtering
 * GET /api/businesses
 */
const getAllBusinesses = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Build query object
        let query = { isActive: true };

        // Search by name or description
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by location (contains search)
        if (req.query.location) {
            query.location = { $regex: req.query.location, $options: 'i' };
        }

        // Build sort object
        let sort = {};
        switch (req.query.sortBy) {
            case 'name':
                sort.name = req.query.sortOrder === 'desc' ? -1 : 1;
                break;
            case 'views':
                sort.viewCount = req.query.sortOrder === 'asc' ? 1 : -1;
                break;
            case 'favorites':
                sort.favoriteCount = req.query.sortOrder === 'asc' ? 1 : -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            case 'oldest':
                sort.createdAt = 1;
                break;
            default:
                // If text search, sort by score, otherwise by name
                if (req.query.search) {
                    sort = { score: { $meta: 'textScore' } };
                } else {
                    sort.name = 1;
                }
        }

        // Execute query
        const businesses = await Business.find(query)
            .select(req.query.search ? { score: { $meta: 'textScore' } } : {})
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Business.countDocuments(query);

        // If user is authenticated, mark favorites
        let businessesResponse = businesses.map(business => ({
            id: business._id,
            name: business.name,
            category: business.category,
            description: business.description,
            location: business.location,
            coordinates: business.coordinates,
            phone: business.phone,
            email: business.email,
            website: business.website,
            specialOffers: business.specialOffers,
            images: business.images,
            viewCount: business.viewCount,
            favoriteCount: business.favoriteCount,
            isFavorite: req.user ? req.user.favorites.includes(business._id) : false,
            createdAt: business.createdAt
        }));

        res.status(200).json(
            formatPaginatedResponse(businessesResponse, page, limit, total, 'Businesses retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get business by ID
 * GET /api/businesses/:id
 */
const getBusinessById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const business = await Business.findById(id);

        if (!business || !business.isActive) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        // Increment view count
        await business.incrementViews();

        const businessResponse = {
            id: business._id,
            name: business.name,
            category: business.category,
            description: business.description,
            location: business.location,
            coordinates: business.coordinates,
            phone: business.phone,
            email: business.email,
            website: business.website,
            specialOffers: business.specialOffers,
            images: business.images,
            viewCount: business.viewCount,
            favoriteCount: business.favoriteCount,
            isFavorite: req.user ? req.user.favorites.includes(business._id) : false,
            createdAt: business.createdAt,
            updatedAt: business.updatedAt
        };

        res.status(200).json(
            formatSuccessResponse(businessResponse, 'Business retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Create new business (Admin only)
 * POST /api/businesses
 */
const createBusiness = async (req, res, next) => {
    try {
        const businessData = req.body;

        const business = await Business.create(businessData);

        const businessResponse = {
            id: business._id,
            name: business.name,
            category: business.category,
            description: business.description,
            location: business.location,
            coordinates: business.coordinates,
            phone: business.phone,
            email: business.email,
            website: business.website,
            specialOffers: business.specialOffers,
            images: business.images,
            viewCount: business.viewCount,
            favoriteCount: business.favoriteCount,
            createdAt: business.createdAt
        };

        res.status(201).json(
            formatSuccessResponse(businessResponse, 'Business created successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Update business (Admin only)
 * PATCH /api/businesses/:id
 */
const updateBusiness = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const business = await Business.findById(id);
        if (!business) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        const updatedBusiness = await Business.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        const businessResponse = {
            id: updatedBusiness._id,
            name: updatedBusiness.name,
            category: updatedBusiness.category,
            description: updatedBusiness.description,
            location: updatedBusiness.location,
            coordinates: updatedBusiness.coordinates,
            phone: updatedBusiness.phone,
            email: updatedBusiness.email,
            website: updatedBusiness.website,
            specialOffers: updatedBusiness.specialOffers,
            images: updatedBusiness.images,
            viewCount: updatedBusiness.viewCount,
            favoriteCount: updatedBusiness.favoriteCount,
            isActive: updatedBusiness.isActive,
            createdAt: updatedBusiness.createdAt,
            updatedAt: updatedBusiness.updatedAt
        };

        res.status(200).json(
            formatSuccessResponse(businessResponse, 'Business updated successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Delete business (Admin only)
 * DELETE /api/businesses/:id
 */
const deleteBusiness = async (req, res, next) => {
    try {
        const { id } = req.params;

        const business = await Business.findById(id);
        if (!business) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        // Soft delete by setting isActive to false
        business.isActive = false;
        await business.save();

        res.status(200).json(
            formatSuccessResponse(null, 'Business deleted successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get business categories
 * GET /api/businesses/categories
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = [
            'Hospitals',
            'Import/Export',
            'Restaurants',
            'Retail',
            'Services',
            'Technology',
            'Education',
            'Entertainment',
            'Automotive',
            'Real Estate',
            'Finance',
            'Legal',
            'Other'
        ];

        // Get count for each category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const count = await Business.countDocuments({ category, isActive: true });
                return { name: category, count };
            })
        );

        res.status(200).json(
            formatSuccessResponse(categoriesWithCounts, 'Categories retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getCategories
};