// SeedFromJSON.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Business = require('../models/Business');

// Optional: normalize string for better keyword matching
const normalize = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function main() {
    // 1. Connect to MongoDB
    await mongoose.connect(
        "mongodb+srv://yellowpagesadmin:scaRHtNBtgLpsU45@cluster0.zobpvu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to MongoDB');

    // 2. Load JSON file
    const filePath = path.join(__dirname, 'sample_companies.json');
    if (!fs.existsSync(filePath)) {
        console.error('JSON file not found at', filePath);
        process.exit(1);
    }
    const rawData = fs.readFileSync(filePath, 'utf8');
    const companies = JSON.parse(rawData);

    // 3. Transform and insert each record
    const docs = companies.map(c => {
        const tradeName = c.trade_name || c.name_eng || '';
        const description = c.description || '';

        return {
            name: tradeName,
            category: Business.categorizeByName(normalize(tradeName), normalize(description)) || 'Other',
            description: '', // optional
            location: [c.region, c.zone, c.subcity_woreda, c.kebele, c.house_no]
                .filter(Boolean).join(', ') || 'Location not specified',
            phone: c.phone || c.mobile || '',
            paidUpCapital: c.paid_up_capital || c.paidup_capital || c.capital || 0,
            managerInfo: {
                managerName: c.manager_name_eng_x || c.manager_name || ''
            },
            registrationInfo: {
                licenseNumber: c.license_number || c.license_no || '',
                registrationNumber: c.registration_number || '',
                tin: c.tin || '',
                legalStatus: c.legal_status || '',
                registeredDate: c.registered_date ? new Date(c.registered_date) : undefined,
                renewedFrom: c.renewed_from_raw || '',
                region: c.region || '',
                zone: c.zone || '',
                subcityWoreda: c.subcity_woreda || '',
                kebele: c.kebele || '',
                houseNo: c.house_no || ''
            },
            isActive: true,
            email: c.email || '',
            website: c.website || ''
        };
    });

    try {
        const result = await Business.insertMany(docs);
        console.log(`Inserted ${result.length} businesses`);
    } catch (err) {
        console.error('Error inserting businesses:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
