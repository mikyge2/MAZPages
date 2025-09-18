const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const User = require('../models/User');
const Business = require('../models/Business');
require('dotenv').config();

// ---------- Utility helpers ----------
const cleanText = text =>
    !text || text.toLowerCase() === 'null' ? '' : text.toString().trim();

const parseNumeric = value => {
    if (!value || value.toLowerCase?.() === 'null') return 0;
    const n = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : Math.max(0, n);
};

const parseDate = str => {
    if (!str || str.toLowerCase?.() === 'null') return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

const combineBilingualText = (eng, amh) => {
    const e = cleanText(eng);
    const a = cleanText(amh);
    return e && a ? `${e} (${a})` : e || a || '';
};

const combinePhones = (phone, mobile) => {
    const p = cleanText(phone);
    const m = cleanText(mobile);
    return p && m ? `${p} / ${m}` : p || m || '';
};

const buildLocation = (region, zone, subcityWoreda, kebele, houseNo) =>
    [region, zone, subcityWoreda, kebele, houseNo]
        .map(cleanText)
        .filter(Boolean)
        .join(', ') || 'Location not specified';

const buildDescription = (legalStatus, tin, license, regNum, regDate, renewed, region) => {
    let desc = 'Business registered';
    if (cleanText(legalStatus)) desc += ` as ${cleanText(legalStatus)}`;

    const details = [];
    if (cleanText(tin)) details.push(`TIN: ${cleanText(tin)}`);
    if (cleanText(license)) details.push(`License Number: ${cleanText(license)}`);
    if (cleanText(regNum)) details.push(`Registration Number: ${cleanText(regNum)}`);
    if (details.length) desc += ` under ${details.join(' & ')}`;

    const d = parseDate(regDate);
    if (d) desc += ` since ${d.getFullYear()}`;
    if (cleanText(renewed)) desc += ` and renewed from ${cleanText(renewed)}`;
    if (cleanText(region)) desc += ` in ${cleanText(region)}`;
    return `${desc}.`;
};

// ---------- CSV row processor ----------
const processCSVRow = row => {
    try {
        if (!cleanText(row.trade_name)) return null;

        const name = combineBilingualText(row.trade_name, row.trade_name_amh);
        if (!name) return null;

        return {
            name,
            category: Business.categorizeByName(name),
            description: buildDescription(
                row.legal_status,
                row.tin,
                row.license_number,
                row.registration_number,
                row.registered_date,
                row.renewed_from_raw,
                row.region
            ),
            location: buildLocation(
                row.region,
                row.zone,
                row.subcity_woreda,
                row.kebele,
                row.house_no
            ),
            phone: combinePhones(row.phone, row.mobile),
            email: '',
            website: '',
            paidUpCapital: parseNumeric(row.capital),
            specialOffers: '',
            images: [],
            managerInfo: {
                managerName: combineBilingualText(row.manager_name_eng_x, row.manager_name_amh)
            },
            registrationInfo: {
                licenseNumber: cleanText(row.license_number),
                registrationNumber: cleanText(row.registration_number),
                tin: cleanText(row.tin),
                legalStatus: cleanText(row.legal_status),
                registeredDate: parseDate(row.registered_date),
                renewedFrom: cleanText(row.renewed_from_raw),
                region: cleanText(row.region),
                zone: cleanText(row.zone),
                subcityWoreda: cleanText(row.subcity_woreda),
                kebele: cleanText(row.kebele),
                houseNo: cleanText(row.house_no)
            },
            isActive: true
        };
    } catch (err) {
        console.error('Error processing CSV row:', err, 'Row:', row);
        return null;
    }
};

// ---------- CSV reader ----------
const readCSVFile = filePath =>
    new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            reject(new Error(`CSV file not found at ${filePath}`));
            return;
        }
        const businesses = [];
        let processed = 0, skipped = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => {
                const doc = processCSVRow(row);
                doc ? (businesses.push(doc), processed++) : skipped++;
                if ((processed + skipped) % 100 === 0) {
                    console.log(`Processed ${processed + skipped} rows (${processed} valid, ${skipped} skipped)`);
                }
            })
            .on('end', () => {
                console.log(`CSV complete: ${processed} valid, ${skipped} skipped`);
                resolve(businesses);
            })
            .on('error', reject);
    });

// ---------- Insert in batches ----------
const insertBusinessesInBatches = async (businesses, batchSize = 100) => {
    console.log(`Inserting ${businesses.length} businesses in batches of ${batchSize}`);
    let inserted = 0, errors = 0;

    for (let i = 0; i < businesses.length; i += batchSize) {
        const batch = businesses.slice(i, i + batchSize);
        try {
            await Business.insertMany(batch, { ordered: false });
            inserted += batch.length;
        } catch (e) {
            if (e.writeErrors) {
                inserted += batch.length - e.writeErrors.length;
                errors += e.writeErrors.length;
            } else {
                errors += batch.length;
            }
        }
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: total inserted ${inserted}`);
    }
    console.log(`Finished: ${inserted} inserted, ${errors} errors`);
    return { inserted, errors };
};

// ---------- Main seed function ----------
const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await User.deleteMany({});
        await Business.deleteMany({});
        console.log('Cleared existing data');

        const adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@yellowpages.com',
            password: 'admin123456',
            role: 'admin'
        });

        const regularUser = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'user'
        });

        const csvFilePath = path.join(__dirname, '..', 'Bussinesses Raw data.csv');
        let businesses;
        try {
            businesses = await readCSVFile(csvFilePath);
        } catch {
            console.warn('CSV not found, using sample data');
            businesses = [
                {
                    name: 'Sample Hospital (ናሙና ሆስፒታል)',
                    category: 'Hospitals',
                    description: 'Business registered as Private Limited Company under TIN: 123456789 & License Number: HL001 since 2020 in Addis Ababa.',
                    location: 'Addis Ababa, Bole, Sub City 01, Kebele 03, House 123',
                    phone: '+251911234567 / +251115551234',
                    paidUpCapital: 2500000,
                    managerInfo: { managerName: 'Dr. John Smith (ዶ/ር ዮሃንስ ስሚዝ)' },
                    registrationInfo: {
                        licenseNumber: 'HL001',
                        registrationNumber: 'REG123456',
                        tin: '123456789',
                        legalStatus: 'Private Limited Company',
                        registeredDate: new Date('2020-01-01'),
                        renewedFrom: '2023',
                        region: 'Addis Ababa',
                        zone: 'Bole',
                        subcityWoreda: 'Sub City 01',
                        kebele: 'Kebele 03',
                        houseNo: 'House 123'
                    }
                }
            ];
        }

        if (businesses.length) {
            const { inserted } = await insertBusinessesInBatches(businesses);
            if (inserted) {
                const favorites = await Business.find({}).limit(3);
                if (favorites.length) {
                    regularUser.favorites.push(...favorites.map(b => b._id));
                    await regularUser.save();
                }
            }
        }

        console.log('\nSeed complete');
        console.log('Admin login: admin@yellowpages.com / admin123456');
        console.log('User login: john@example.com / password123');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

if (require.main === module) seedData();
module.exports = seedData;
