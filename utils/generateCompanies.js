// generateCompanies.js
const { faker } = require('@faker-js/faker');
const fs = require('fs');

// Categories and sample keywords for categorization
const categories = {
    'Hospitals': ['Hospital', 'Clinic', 'Medical', 'Pharmacy', 'Diagnostic'],
    'Restaurants': ['Restaurant', 'Cafe', 'Bar', 'Pizza', 'Bakery', 'Coffee'],
    'Import/Export': ['Import', 'Export', 'Trading', 'Cargo', 'Freight'],
    'Retail': ['Shop', 'Store', 'Market', 'Supermarket', 'Boutique', 'Fashion'],
    'Technology': ['Tech', 'Software', 'Computer', 'IT', 'Digital', 'System'],
    'Education': ['School', 'College', 'University', 'Academy', 'Training'],
    'Entertainment': ['Cinema', 'Theatre', 'Gaming', 'Sport', 'Entertainment'],
    'Automotive': ['Auto', 'Car', 'Garage', 'Vehicle', 'Mechanic'],
    'Real Estate': ['Real Estate', 'Property', 'Developer', 'Construction'],
    'Finance': ['Bank', 'Insurance', 'Loan', 'Credit', 'Financial'],
    'Legal': ['Law', 'Legal', 'Attorney', 'Advocate', 'Court'],
    'Manufacturing': ['Factory', 'Manufacturing', 'Production', 'Textile'],
    'Construction': ['Construction', 'Contractor', 'Engineering', 'Builder'],
    'Agriculture': ['Farm', 'Agriculture', 'Crop', 'Livestock', 'Dairy'],
    'Transportation': ['Transport', 'Logistics', 'Delivery', 'Shipping', 'Taxi'],
    'Telecommunications': ['Telecom', 'Mobile', 'Network', 'Communication'],
    'Energy': ['Energy', 'Power', 'Solar', 'Fuel', 'Electricity'],
    'Mining': ['Mining', 'Quarry', 'Mineral', 'Extraction', 'Geological'],
    'Tourism': ['Tourism', 'Travel', 'Resort', 'Guide', 'Lodge']
};

const allCategories = Object.keys(categories);

function makeBusiness(i) {
    const regions = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'SNNPR'];
    const legalStatuses = ['Private Limited Company', 'Share Company', 'Sole Proprietorship'];

    const region = faker.helpers.arrayElement(regions);
    const zone = faker.location.city();
    const subcity_woreda = `Subcity ${faker.number.int({ min: 1, max: 10 })}`;
    const kebele = `Kebele ${faker.number.int({ min: 1, max: 20 })}`;
    const house_no = faker.number.int({ min: 1, max: 999 }).toString();
    const mobile = `+2519${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`;
    const phone = `+2511${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`;

    // Choose a category randomly and a keyword from it
    const category = faker.helpers.arrayElement(allCategories);
    const keyword = faker.helpers.arrayElement(categories[category]);
    const tradeName = `${faker.company.name()} ${keyword}`; // inject keyword

    const managerEng = faker.person.fullName();
    const tin = faker.number.int({ min: 100000000, max: 999999999 }).toString();
    const registration_number = `REG${faker.number.int({ min: 10000, max: 99999 })}`;
    const license_number = `LIC${faker.number.int({ min: 1000, max: 9999 })}`;
    const legal_status = faker.helpers.arrayElement(legalStatuses);
    const capital = faker.number.int({ min: 50_000, max: 5_000_000 });
    const paidUpCapital = faker.number.int({ min: 50_000, max: 5_000_000 });
    const registered_date = faker.date.between({ from: '2015-01-01', to: '2024-12-31' });
    const renewed_from_raw = faker.date
        .between({ from: '2020-01-01', to: '2025-01-01' })
        .getFullYear()
        .toString();

    const phoneNumber = faker.phone.number('+2519########');        // Ethiopian mobile format
    const email = faker.internet.email({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        provider: 'example.com' // or let faker choose
    });
    const website = faker.internet.url();

    return {
        license_no: `LNO${1000 + i}`,
        region,
        zone,
        subcity_woreda,
        kebele,
        house_no,
        mobile,
        phone,
        trade_name: tradeName,
        manager_name: managerEng,
        manager_name_eng_x: managerEng,
        tin,
        registration_number,
        name_amh: '',
        name_eng: tradeName,
        legal_status,
        capital,
        registered_date,
        manager_name_amh: '',
        manager_name_eng_y: managerEng,
        trade_name_amh: '',
        subgroups_joined: '',
        license_number,
        renewed_from_raw,
        paidup_capital: paidUpCapital,
        phone_number: phoneNumber,
        email: email,
        website: website,
    };
}

// generate 50 records and write to file
const businesses = Array.from({ length: 50 }, (_, i) => makeBusiness(i + 1));
fs.writeFileSync('sample_companies.json', JSON.stringify(businesses, null, 2));
console.log('Created sample_companies.json with 50 categorizable records');
