const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        maxlength: [100, 'Business name cannot exceed 100 characters']
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
        ]
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
    coordinates: {
        latitude: {
            type: Number,
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90']
        },
        longitude: {
            type: Number,
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180']
        }
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
    },
    website: {
        type: String,
        trim: true,
        match: [
            /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            'Please enter a valid website URL'
        ]
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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better search performance
businessSchema.index({ name: 'text', description: 'text' });
businessSchema.index({ category: 1 });
businessSchema.index({ location: 1 });
businessSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for coordinates as GeoJSON Point (for future geospatial queries)
businessSchema.virtual('geoLocation').get(function() {
    if (this.coordinates && this.coordinates.latitude && this.coordinates.longitude) {
        return {
            type: 'Point',
            coordinates: [this.coordinates.longitude, this.coordinates.latitude]
        };
    }
    return null;
});

// Method to increment view count
businessSchema.methods.incrementViews = function() {
    this.viewCount += 1;
    return this.save();
};

module.exports = mongoose.model('Business', businessSchema);