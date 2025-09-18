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

        // Filter by paid up capital range
        if (req.query.paidUpCapitalRange) {
            query.paidUpCapitalRange = req.query.paidUpCapitalRange;
        }

        // Filter by paid up capital amount (min/max)
        if (req.query.minCapital || req.query.maxCapital) {
            query.paidUpCapital = {};
            if (req.query.minCapital) {
                query.paidUpCapital.$gte = parseInt(req.query.minCapital);
            }
            if (req.query.maxCapital) {
                query.paidUpCapital.$lte = parseInt(req.query.maxCapital);
            }
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
            case 'capital':
                sort.paidUpCapital = req.query.sortOrder === 'asc' ? 1 : -1;
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

        // Format response based on whether request is from crawler
        let businessesResponse;

        if (req.isCrawler) {
            // Return SEO-friendly data for crawlers (hide sensitive info)
            businessesResponse = businesses.map(business => business.getPublicData());
        } else {
            // Return full data for regular users
            businessesResponse = businesses.map(business => ({
                id: business._id,
                name: business.name,
                category: business.category,
                description: business.description,
                location: business.location,
                phone: business.phone,
                email: business.email,
                website: business.website,
                paidUpCapital: business.paidUpCapital,
                paidUpCapitalRange: business.paidUpCapitalRange,
                specialOffers: business.specialOffers,
                images: business.images,
                viewCount: business.viewCount,
                favoriteCount: business.favoriteCount,
                seoSlug: business.seoSlug,
                metaDescription: business.metaDescription,
                managerInfo: business.managerInfo,
                registrationInfo: business.registrationInfo,
                isFavorite: req.user ? req.user.favorites.includes(business._id) : false,
                createdAt: business.createdAt
            }));
        }

        res.status(200).json(
            formatPaginatedResponse(businessesResponse, page, limit, total, 'Businesses retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get business by ID or SEO slug
 * GET /api/businesses/:id
 */
const getBusinessById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Try to find by MongoDB ObjectId first, then by SEO slug
        let business;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            // Valid ObjectId
            business = await Business.findById(id);
        } else {
            // Assume it's a SEO slug
            business = await Business.findOne({ seoSlug: id });
        }

        if (!business || !business.isActive) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        // Increment view count (only for non-crawler requests to avoid inflating stats)
        if (!req.isCrawler) {
            await business.incrementViews();
        }

        // Format response based on whether request is from crawler
        let businessResponse;

        if (req.isCrawler) {
            // Return SEO-friendly data for crawlers (hide sensitive info)
            businessResponse = business.getPublicData();
        } else {
            // Return full data for regular users
            businessResponse = {
                id: business._id,
                name: business.name,
                category: business.category,
                description: business.description,
                location: business.location,
                phone: business.phone,
                email: business.email,
                website: business.website,
                paidUpCapital: business.paidUpCapital,
                paidUpCapitalRange: business.paidUpCapitalRange,
                specialOffers: business.specialOffers,
                images: business.images,
                viewCount: business.viewCount,
                favoriteCount: business.favoriteCount,
                seoSlug: business.seoSlug,
                metaDescription: business.metaDescription,
                managerInfo: business.managerInfo,
                registrationInfo: business.registrationInfo,
                isFavorite: req.user ? req.user.favorites.includes(business._id) : false,
                createdAt: business.createdAt,
                updatedAt: business.updatedAt
            };
        }

        res.status(200).json(
            formatSuccessResponse(businessResponse, 'Business retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get similar businesses for a specific business
 * GET /api/businesses/:id/similar
 */
const getSimilarBusinesses = async (req, res, next) => {
    try {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        // Find the business first
        let business;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            business = await Business.findById(id);
        } else {
            business = await Business.findOne({ seoSlug: id });
        }

        if (!business || !business.isActive) {
            return res.status(404).json(
                formatErrorResponse('Business not found', 'BUSINESS_NOT_FOUND')
            );
        }

        // Get similar businesses
        const similarBusinesses = await business.getSimilarBusinesses(limit);

        // Format response based on whether request is from crawler
        let businessesResponse;

        if (req.isCrawler) {
            // Return SEO-friendly data for crawlers (hide sensitive info)
            businessesResponse = similarBusinesses.map(b => ({
                id: b._id,
                name: b.name,
                category: b.category,
                location: b.location,
                seoSlug: b.seoSlug,
                viewCount: b.viewCount,
                favoriteCount: b.favoriteCount,
                createdAt: b.createdAt
            }));
        } else {
            // Return full data for regular users
            businessesResponse = similarBusinesses.map(b => ({
                id: b._id,
                name: b.name,
                category: b.category,
                location: b.location,
                paidUpCapitalRange: b.paidUpCapitalRange,
                viewCount: b.viewCount,
                favoriteCount: b.favoriteCount,
                seoSlug: b.seoSlug,
                region: b.registrationInfo?.region,
                isFavorite: req.user ? req.user.favorites.includes(b._id) : false,
                createdAt: b.createdAt
            }));
        }

        res.status(200).json(
            formatSuccessResponse(
                businessesResponse,
                `Found ${businessesResponse.length} similar businesses`
            )
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
            phone: business.phone,
            email: business.email,
            website: business.website,
            paidUpCapital: business.paidUpCapital,
            paidUpCapitalRange: business.paidUpCapitalRange,
            specialOffers: business.specialOffers,
            images: business.images,
            seoSlug: business.seoSlug,
            metaDescription: business.metaDescription,
            managerInfo: business.managerInfo,
            registrationInfo: business.registrationInfo,
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
            phone: updatedBusiness.phone,
            email: updatedBusiness.email,
            website: updatedBusiness.website,
            paidUpCapital: updatedBusiness.paidUpCapital,
            paidUpCapitalRange: updatedBusiness.paidUpCapitalRange,
            specialOffers: updatedBusiness.specialOffers,
            images: updatedBusiness.images,
            seoSlug: updatedBusiness.seoSlug,
            metaDescription: updatedBusiness.metaDescription,
            managerInfo: updatedBusiness.managerInfo,
            registrationInfo: updatedBusiness.registrationInfo,
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
 * Get business categories with paid up capital ranges
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

/**
 * Get paid up capital ranges
 * GET /api/businesses/capital-ranges
 */
const getCapitalRanges = async (req, res, next) => {
    try {
        const capitalRanges = Business.getCapitalRanges();

        // Get count for each range
        const rangesWithCounts = await Promise.all(
            capitalRanges.map(async (range) => {
                const count = await Business.countDocuments({
                    paidUpCapitalRange: range,
                    isActive: true
                });
                return { name: range, count };
            })
        );

        res.status(200).json(
            formatSuccessResponse(rangesWithCounts, 'Capital ranges retrieved successfully')
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBusinesses,
    getBusinessById,
    getSimilarBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getCategories,
    getCapitalRanges
};