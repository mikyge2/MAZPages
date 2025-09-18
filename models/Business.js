const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters'],
        index: true // Index for SEO-friendly queries
    },
    category: {
        type: String,
        required: [true, 'Business category is required'],
        enum: [
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
        ],
        index: true // Index for category-based queries
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    location: {
        type: String,
        required: [true, 'Business location is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number'],
        select: true // Will be conditionally excluded for crawlers
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ],
        select: true // Will be conditionally excluded for crawlers
    },
    website: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            'Please enter a valid website URL'
        ]
    },
    paidUpCapital: {
        type: Number,
        min: [0, 'Paid up capital cannot be negative'],
        max: [1000000000, 'Paid up capital too large'], // 1 billion max
        select: true // Will be conditionally excluded for crawlers
    },
    paidUpCapitalRange: {
        type: String,
        enum: [
            'Under $10K',
            '$10K - $50K',
            '$50K - $100K',
            '$100K - $500K',
            '$500K - $1M',
            '$1M - $5M',
            '$5M - $10M',
            '$10M+',
            'Not Disclosed'
        ],
        default: 'Not Disclosed'
    },
    specialOffers: {
        type: String,
        trim: true,
        maxlength: [200, 'Special offers cannot exceed 200 characters']
    },
    images: [{
        type: String,
        match: [
            /^(https?:\/\/).+\.(jpg|jpeg|png|gif|webp)$/i,
            'Please enter a valid image URL'
        ]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    viewCount: {
        type: Number,
        default: 0
    },
    favoriteCount: {
        type: Number,
        default: 0
    },
    // SEO-friendly fields
    seoSlug: {
        type: String,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },
    metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret, options) {
            // Remove sensitive fields for crawlers if specified in options
            if (options.hideSensitive) {
                delete ret.phone;
                delete ret.email;
                delete ret.paidUpCapital;
                delete ret.paidUpCapitalRange;
            }
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes for better search and similar business queries
businessSchema.index({ name: 'text', description: 'text' });
businessSchema.index({ category: 1, paidUpCapitalRange: 1 }); // Compound index for similar businesses
businessSchema.index({ category: 1, paidUpCapital: 1 }); // Compound index for capital-based filtering
businessSchema.index({ location: 1 });
businessSchema.index({ seoSlug: 1 });
businessSchema.index({ isActive: 1, viewCount: -1 }); // For popular businesses

// Pre-save middleware to generate SEO slug
businessSchema.pre('save', function(next) {
    if (this.isModified('name') || !this.seoSlug) {
        // Generate SEO-friendly slug from business name
        this.seoSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove duplicate hyphens
            .trim('-'); // Remove leading/trailing hyphens

        // Add random suffix to ensure uniqueness
        this.seoSlug += '-' + Math.random().toString(36).substr(2, 6);
    }

    // Auto-generate meta description if not provided
    if (this.isModified('description') && !this.metaDescription && this.description) {
        this.metaDescription = this.description.substring(0, 157) + '...';
    }

    next();
});

// Method to increment view count
businessSchema.methods.incrementViews = function() {
    this.viewCount += 1;
    return this.save();
};

// Method to get similar businesses
businessSchema.methods.getSimilarBusinesses = async function(limit = 100) {
    const Business = this.constructor;

    // Build query for similar businesses
    let query = {
        _id: { $ne: this._id }, // Exclude current business
        category: this.category,
        isActive: true
    };

    // If paidUpCapitalRange is available, prioritize same range
    if (this.paidUpCapitalRange && this.paidUpCapitalRange !== 'Not Disclosed') {
        query.paidUpCapitalRange = this.paidUpCapitalRange;
    }

    let similarBusinesses = await Business.find(query)
        .select('name category location paidUpCapitalRange viewCount favoriteCount createdAt seoSlug')
        .sort({ viewCount: -1, favoriteCount: -1 })
        .limit(limit);

    // If we don't have enough similar businesses with same capital range,
    // get more from the same category
    if (similarBusinesses.length < limit) {
        const remaining = limit - similarBusinesses.length;
        const excludeIds = similarBusinesses.map(b => b._id).concat([this._id]);

        const additionalBusinesses = await Business.find({
            _id: { $nin: excludeIds },
            category: this.category,
            isActive: true
        })
            .select('name category location paidUpCapitalRange viewCount favoriteCount createdAt seoSlug')
            .sort({ viewCount: -1, favoriteCount: -1 })
            .limit(remaining);

        similarBusinesses = similarBusinesses.concat(additionalBusinesses);
    }

    return similarBusinesses;
};

// Method to get public data for crawlers (SEO-safe)
businessSchema.methods.getPublicData = function() {
    return {
        id: this._id,
        name: this.name,
        category: this.category,
        description: this.description,
        location: this.location,
        website: this.website,
        specialOffers: this.specialOffers,
        images: this.images,
        viewCount: this.viewCount,
        favoriteCount: this.favoriteCount,
        seoSlug: this.seoSlug,
        metaDescription: this.metaDescription,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to get capital ranges for filtering
businessSchema.statics.getCapitalRanges = function() {
    return [
        'Under $10K',
        '$10K - $50K',
        '$50K - $100K',
        '$100K - $500K',
        '$500K - $1M',
        '$1M - $5M',
        '$5M - $10M',
        '$10M+',
        'Not Disclosed'
    ];
};

module.exports = mongoose.model('Business', businessSchema);