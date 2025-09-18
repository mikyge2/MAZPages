const mongoose = require('mongoose');
const User = require('../models/User');
const Business = require('../models/Business');
require('dotenv').config();

// Sample businesses data
const sampleBusinesses = [
    {
        name: "Central Hospital",
        category: "Hospitals",
        description: "Full-service hospital with emergency care, surgery, and specialized treatments.",
        location: "123 Medical Center Drive, Downtown",
        phone: "+1-555-0123",
        email: "info@centralhospital.com",
        website: "https://centralhospital.com",
        paidUpCapital: 5000000,
        paidUpCapitalRange: "$1M - $5M",
        specialOffers: "Free health screenings every first Monday of the month",
        images: ["https://example.com/hospital1.jpg"]
    },
    {
        name: "Global Trade Solutions",
        category: "Import/Export",
        description: "International trade company specializing in electronics and automotive parts.",
        location: "456 Commerce Street, Business District",
        phone: "+1-555-0456",
        email: "sales@globaltrade.com",
        website: "https://globaltrade.com",
        paidUpCapital: 2500000,
        paidUpCapitalRange: "$1M - $5M",
        specialOffers: "10% discount on first international shipment",
        images: ["https://example.com/trade1.jpg"]
    },
    {
        name: "Bella Vista Restaurant",
        category: "Restaurants",
        description: "Authentic Italian cuisine with fresh ingredients and homemade pasta.",
        location: "789 Culinary Avenue, Food District",
        phone: "+1-555-0789",
        email: "reservations@bellavista.com",
        website: "https://bellavista.com",
        paidUpCapital: 150000,
        paidUpCapitalRange: "$100K - $500K",
        specialOffers: "Happy hour 4-6 PM, 20% off appetizers",
        images: ["https://example.com/restaurant1.jpg"]
    },
    {
        name: "TechFlow Solutions",
        category: "Technology",
        description: "Software development and IT consulting services for small to medium businesses.",
        location: "321 Innovation Hub, Tech Park",
        phone: "+1-555-0321",
        email: "contact@techflow.com",
        website: "https://techflow.com",
        paidUpCapital: 750000,
        paidUpCapitalRange: "$500K - $1M",
        specialOffers: "Free consultation for new clients",
        images: ["https://example.com/tech1.jpg"]
    },
    {
        name: "Elite Auto Repair",
        category: "Automotive",
        description: "Professional auto repair and maintenance services for all vehicle types.",
        location: "654 Motor Street, Industrial Area",
        phone: "+1-555-0654",
        email: "service@eliteauto.com",
        website: "https://eliteauto.com",
        paidUpCapital: 75000,
        paidUpCapitalRange: "$50K - $100K",
        specialOffers: "10% discount on first service",
        images: ["https://example.com/auto1.jpg"]
    },
    // Additional businesses for better "similar business" testing
    {
        name: "Metro General Hospital",
        category: "Hospitals",
        description: "Modern healthcare facility with 24/7 emergency services and specialist care.",
        location: "890 Health Boulevard, Medical District",
        phone: "+1-555-0890",
        email: "contact@metrohealth.com",
        website: "https://metrohealth.com",
        paidUpCapital: 8000000,
        paidUpCapitalRange: "$5M - $10M",
        specialOffers: "Senior citizen discounts available",
        images: ["https://example.com/hospital2.jpg"]
    },
    {
        name: "Pacific Trading Corp",
        category: "Import/Export",
        description: "Established trading company focusing on Asian markets and consumer goods.",
        location: "234 Harbor Street, Port District",
        phone: "+1-555-0234",
        email: "info@pacifictrade.com",
        website: "https://pacifictrade.com",
        paidUpCapital: 3200000,
        paidUpCapitalRange: "$1M - $5M",
        specialOffers: "Bulk order discounts for regular clients",
        images: ["https://example.com/trade2.jpg"]
    },
    {
        name: "Luigi's Pizza Corner",
        category: "Restaurants",
        description: "Family-owned pizzeria serving traditional wood-fired pizzas since 1985.",
        location: "567 Main Street, Little Italy",
        phone: "+1-555-0567",
        email: "orders@luigispizza.com",
        website: "https://luigispizza.com",
        paidUpCapital: 85000,
        paidUpCapitalRange: "$50K - $100K",
        specialOffers: "Family meal deals every Tuesday",
        images: ["https://example.com/pizza1.jpg"]
    }
];

// Connect to MongoDB and seed data
const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB for seeding');

        // Clear existing data
        await User.deleteMany({});
        await Business.deleteMany({});
        console.log('🧹 Cleared existing data');

        // Create admin user
        const adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@yellowpages.com',
            password: 'admin123456',
            role: 'admin'
        });
        console.log('👤 Created admin user');

        // Create regular user
        const regularUser = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'user'
        });
        console.log('👤 Created regular user');

        // Create businesses
        const businesses = await Business.create(sampleBusinesses);
        console.log(`🏢 Created ${businesses.length} sample businesses`);

        // Add some businesses to user's favorites
        regularUser.favorites.push(businesses[0]._id, businesses[2]._id);
        await regularUser.save();
        console.log('⭐ Added favorites to regular user');

        console.log('\n✅ Seed data created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@yellowpages.com / admin123456');
        console.log('User: john@example.com / password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

// Run seed function if called directly
if (require.main === module) {
    seedData();
}

module.exports = seedData;