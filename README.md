# Digital Yellow Pages Backend

A fully free digital yellow pages platform backend built with Node.js, Express.js, and MongoDB. No payments, no premium features, no subscriptions - completely free for all users.

## Features

- **User Management**: Registration, login, profile management with JWT authentication
- **Business Listings**: CRUD operations for business listings with search and filtering
- **Favorites System**: Users can save businesses to their favorites
- **Admin Panel**: Role-based access control for business management
- **Search & Filter**: Full-text search, category filtering, location-based filtering
- **Pagination**: Efficient data loading with pagination support
- **Input Validation**: Comprehensive validation for all endpoints
- **Error Handling**: Centralized error handling with detailed error messages
- **Logging**: Request/response logging for monitoring

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Input validation
- **Winston** - Logging
- **Helmet** - Security headers

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd digital-yellow-pages-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/favorites` - Add business to favorites
- `DELETE /api/users/:id/favorites/:businessId` - Remove from favorites

### Businesses
- `GET /api/businesses` - Get businesses (with search/filter)
- `GET /api/businesses/categories` - Get business categories
- `GET /api/businesses/capital-ranges` - Get paid up capital ranges
- `GET /api/businesses/:id` - Get business by ID or SEO slug
- `GET /api/businesses/:id/similar` - Get similar businesses (Browse 100 Similar)
- `POST /api/businesses` - Create business (admin only)
- `PATCH /api/businesses/:id` - Update business (admin only)
- `DELETE /api/businesses/:id` - Delete business (admin only)

## Query Parameters

### GET /api/businesses
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search by name/description
- `category` - Filter by category
- `location` - Filter by location (contains)
- `paidUpCapitalRange` - Filter by capital range
- `minCapital` - Minimum paid up capital amount
- `maxCapital` - Maximum paid up capital amount
- `sortBy` - Sort by: name, views, favorites, capital, newest, oldest
- `sortOrder` - asc or desc (default: asc for name, desc for others)

### Example Requests

```bash
# Search for restaurants with capital filter
GET /api/businesses?search=restaurant&category=Restaurants&paidUpCapitalRange=$100K - $500K

# Get businesses in specific location sorted by capital
GET /api/businesses?location=downtown&sortBy=capital&sortOrder=desc

# Find similar businesses (Browse 100 Similar Businesses feature)
GET /api/businesses/507f1f77bcf86cd799439011/similar?limit=50

# Get business by SEO slug
GET /api/businesses/central-hospital-abc123
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": null
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Success Responses

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

For paginated responses:

```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Schema

### User Schema
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: 'user', 'admin'),
  favorites: [ObjectId] (references to Business),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Business Schema
```javascript
{
  name: String (required),
  category: String (required, enum),
  description: String,
  location: String (required),
  phone: String (hidden from crawlers),
  email: String (hidden from crawlers),
  website: String,
  paidUpCapital: Number (hidden from crawlers),
  paidUpCapitalRange: String (hidden from crawlers, enum),
  specialOffers: String,
  images: [String] (URLs),
  isActive: Boolean,
  viewCount: Number,
  favoriteCount: Number,
  seoSlug: String (unique, auto-generated),
  metaDescription: String (SEO),
  createdAt: Date,
  updatedAt: Date
}
```

## Paid Up Capital Ranges

- Under $10K
- $10K - $50K
- $50K - $100K
- $100K - $500K
- $500K - $1M
- $1M - $5M
- $5M - $10M
- $10M+
- Not Disclosed

## Business Categories

- Hospitals
- Import/Export
- Restaurants
- Retail
- Services
- Technology
- Education
- Entertainment
- Automotive
- Real Estate
- Finance
- Legal
- Other

## SEO & Privacy Features

### Crawler Detection & Data Protection
The API automatically detects web crawlers and search engine bots, providing different response formats:

**For Search Engine Crawlers:**
- ✅ Business name and category (for indexing)
- ✅ Description and location
- ✅ Website URL and images
- ❌ Phone numbers (hidden)
- ❌ Email addresses (hidden)
- ❌ Paid up capital information (hidden)

**For Regular Users:**
- ✅ Complete business information
- ✅ Contact details
- ✅ Financial information
- ✅ Favorites functionality

### SEO-Friendly URLs
Businesses are accessible via both MongoDB ObjectId and SEO-friendly slugs:
- `/api/businesses/507f1f77bcf86cd799439011` (ObjectId)
- `/api/businesses/central-hospital-abc123` (SEO slug)

### SEO Headers
Appropriate headers are set for search engine crawlers:
```
Cache-Control: public, max-age=3600, s-maxage=7200
X-Robots-Tag: index, follow, noarchive
Vary: User-Agent
```

### Similar Business Feature
The "Browse 100 Similar Businesses" feature works by:
1. Finding businesses in the same category
2. Prioritizing those with similar paid up capital ranges
3. Sorting by popularity (views and favorites)
4. Returning up to 100 results

Example: For a restaurant with $100K-$500K capital, it will first show other restaurants in the same capital range, then fill remaining slots with any restaurants sorted by popularity.