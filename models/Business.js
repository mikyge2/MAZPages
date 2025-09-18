const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [200, 'Business name cannot exceed 200 characters'], // Increased for bilingual names
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
            'Manufacturing',
            'Construction',
            'Agriculture',
            'Transportation',
            'Telecommunications',
            'Energy',
            'Mining',
            'Tourism',
            'Other'
        ],
        default: 'Other',
        index: true // Index for category-based queries
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'] // Increased for detailed registration info
    },
    location: {
        type: String,
        required: [true, 'Business location is required'],
        trim: true,
        maxlength: [300, 'Location cannot exceed 300 characters'] // Increased for detailed address
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [100, 'Phone cannot exceed 100 characters'], // Increased for multiple numbers
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
        max: [10000000000, 'Paid up capital too large'], // 10 billion max
        default: 0,
        select: true // Will be conditionally excluded for crawlers
    },
    paidUpCapitalRange: {
        type: String,
        enum: [
            'Under $1K',
            '$1K - $5K',
            '$5K - $10K',
            '$10K - $50K',
            '$50K - $100K',
            '$100K - $500K',
            '$500K - $1M',
            '$1M - $5M',
            '$5M - $10M',
            '$10M - $50M',
            '$50M - $100M',
            '$100M+',
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
    // Manager Information
    managerInfo: {
        managerName: {
            type: String,
            trim: true,
            maxlength: [150, 'Manager name cannot exceed 150 characters']
        }
    },
    // Registration & Legal Information (from CSV)
    registrationInfo: {
        licenseNumber: {
            type: String,
            trim: true,
            index: true
        },
        registrationNumber: {
            type: String,
            trim: true,
            index: true
        },
        tin: {
            type: String,
            trim: true,
            index: true
        },
        legalStatus: {
            type: String,
            trim: true
        },
        registeredDate: {
            type: Date
        },
        renewedFrom: {
            type: String,
            trim: true
        },
        region: {
            type: String,
            trim: true,
            index: true
        },
        zone: {
            type: String,
            trim: true
        },
        subcityWoreda: {
            type: String,
            trim: true
        },
        kebele: {
            type: String,
            trim: true
        },
        houseNo: {
            type: String,
            trim: true
        }
    },
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
                delete ret.registrationInfo;
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
businessSchema.index({ 'registrationInfo.region': 1 }); // For region-based queries
businessSchema.index({ 'registrationInfo.licenseNumber': 1 }); // For license lookup
businessSchema.index({ 'registrationInfo.tin': 1 }); // For TIN lookup

// Pre-save middleware to generate SEO slug and calculate capital range
businessSchema.pre('save', function(next) {
    // Generate SEO slug if name is modified or slug doesn't exist
    if (this.isModified('name') || !this.seoSlug) {
        // Generate SEO-friendly slug from business name
        this.seoSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s\-\u1200-\u137F]/g, '') // Allow Ethiopian characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove duplicate hyphens
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50); // Limit length

        // Add random suffix to ensure uniqueness
        this.seoSlug += '-' + Math.random().toString(36).substr(2, 6);
    }

    // Auto-calculate paid up capital range
    if (this.isModified('paidUpCapital') && this.paidUpCapital > 0) {
        const capital = this.paidUpCapital;
        if (capital < 1000) {
            this.paidUpCapitalRange = 'Under $1K';
        } else if (capital < 5000) {
            this.paidUpCapitalRange = '$1K - $5K';
        } else if (capital < 10000) {
            this.paidUpCapitalRange = '$5K - $10K';
        } else if (capital < 50000) {
            this.paidUpCapitalRange = '$10K - $50K';
        } else if (capital < 100000) {
            this.paidUpCapitalRange = '$50K - $100K';
        } else if (capital < 500000) {
            this.paidUpCapitalRange = '$100K - $500K';
        } else if (capital < 1000000) {
            this.paidUpCapitalRange = '$500K - $1M';
        } else if (capital < 5000000) {
            this.paidUpCapitalRange = '$1M - $5M';
        } else if (capital < 10000000) {
            this.paidUpCapitalRange = '$5M - $10M';
        } else if (capital < 50000000) {
            this.paidUpCapitalRange = '$10M - $50M';
        } else if (capital < 100000000) {
            this.paidUpCapitalRange = '$50M - $100M';
        } else {
            this.paidUpCapitalRange = '$100M+';
        }
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
        .select('name category location paidUpCapitalRange viewCount favoriteCount createdAt seoSlug registrationInfo.region')
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
            .select('name category location paidUpCapitalRange viewCount favoriteCount createdAt seoSlug registrationInfo.region')
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
        managerInfo: {
            managerName: this.managerInfo?.managerName
        },
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to get capital ranges for filtering
businessSchema.statics.getCapitalRanges = function() {
    return [
        'Under $1K',
        '$1K - $5K',
        '$5K - $10K',
        '$10K - $50K',
        '$50K - $100K',
        '$100K - $500K',
        '$500K - $1M',
        '$1M - $5M',
        '$5M - $10M',
        '$10M - $50M',
        '$50M - $100M',
        '$100M+',
        'Not Disclosed'
    ];
};

// Static method to categorize business based on name/description
businessSchema.statics.categorizeByName = function(tradeName, description = '') {
    const name = (tradeName + ' ' + description).toLowerCase();

    // Define category keywords
    const categoryKeywords = {
        'Hospitals': ['hospital', 'clinic', 'medical', 'health', 'pharmacy', 'diagnostic'],
        'Restaurants': ['restaurant', 'cafe', 'bar', 'hotel', 'food', 'coffee', 'pizza', 'bakery'],
        'Import/Export': ['import', 'export', 'trading', 'international', 'freight', 'cargo'],
        'Retail': ['shop', 'store', 'market', 'supermarket', 'boutique', 'fashion', 'clothing'],
        'Technology': ['tech', 'software', 'computer', 'internet', 'digital', 'IT', 'system'],
        'Education': ['school', 'college', 'university', 'education', 'training', 'academy'],
        'Entertainment': ['cinema', 'theatre', 'entertainment', 'recreation', 'gaming', 'sport'],
        'Automotive': ['auto', 'car', 'vehicle', 'garage', 'mechanic', 'spare parts'],
        'Real Estate': ['real estate', 'property', 'construction', 'building', 'developer'],
        'Finance': ['bank', 'insurance', 'financial', 'loan', 'credit', 'microfinance'],
        'Legal': ['law', 'legal', 'advocate', 'lawyer', 'attorney', 'court'],
        'Manufacturing': ['factory', 'manufacturing', 'production', 'industry', 'textile', 'leather'],
        'Transportation': ['transport', 'logistics', 'delivery', 'shipping', 'bus', 'taxi'],
        'Agriculture': ['agriculture', 'farm', 'crop', 'livestock', 'dairy', 'poultry'],
        'Construction': ['construction', 'contractor', 'building', 'engineering', 'architecture'],
        'Telecommunications': ['telecom', 'communication', 'mobile', 'network', 'internet'],
        'Energy': ['energy', 'power', 'electricity', 'solar', 'fuel', 'gas'],
        'Mining': ['mining', 'quarry', 'mineral', 'extraction', 'geological'],
        'Tourism': ['tourism', 'travel', 'tour', 'guide', 'resort', 'lodge']
    };

    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            return category;
        }
    }

    return 'Other'; // Default category
};

module.exports = mongoose.model('Business', businessSchema);