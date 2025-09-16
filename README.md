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
- `GET /api/businesses/:id` - Get business by ID
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
- `sortBy` - Sort by: name, views, favorites, newest, oldest
- `sortOrder` - asc or desc (default: asc for name, desc for others)

### Example Requests

```bash
# Search for restaurants
GET /api/businesses?search=restaurant&category=Restaurants

# Get businesses in specific location
GET /api/businesses?location=downtown&limit=10

# Sort by most popular
GET /api/businesses?sortBy=views&sortOrder=desc
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
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  phone: String,
  email: String,
  website: String,
  specialOffers: String,
  images: [String] (URLs),
  isActive: Boolean,
  viewCount: Number,
  favoriteCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

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

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable CORS settings
- **Error Sanitization**: Sensitive information removed from error responses

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data

### Default Admin Account (after seeding)
- Email: `admin@yellowpages.com`
- Password: `admin123456`

### Default User Account (after seeding)
- Email: `john@example.com`
- Password: `password123`

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/yellow-pages

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Deployment

### Prerequisites
- Node.js 16+
- MongoDB 4.4+

### Production Deployment
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Set up MongoDB with proper security
4. Configure reverse proxy (nginx) if needed
5. Set up process manager (PM2)
6. Configure logging destination
7. Set up monitoring

### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'yellow-pages-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

## API Testing

You can test the API using tools like Postman, Insomnia, or curl:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get businesses
curl http://localhost:5000/api/businesses?page=1&limit=5
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please create an issue in the GitHub repository or contact the development team.
```

## Project Structure Summary

```
digital-yellow-pages-backend/
├── config/
│   └── database.js              # MongoDB connection setup
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User management logic
│   └── businessController.js    # Business CRUD operations
├── middleware/
│   ├── auth.js                  # JWT authentication & authorization
│   ├── validation.js            # Input validation with Joi
│   ├── errorHandler.js          # Global error handling
│   └── logging.js               # Request/response logging
├── models/
│   ├── User.js                  # User schema & methods
│   └── Business.js              # Business schema & methods
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── users.js                 # User management routes
│   └── businesses.js            # Business routes
├── utils/
│   ├── hashPassword.js          # Password hashing utilities
│   ├── generateToken.js         # JWT token utilities
│   ├── responseFormatter.js     # API response formatting
│   └── seedData.js              # Database seeding script
├── logs/                        # Log files directory
├── .env                         # Environment variables
├── package.json                 # Dependencies & scripts
├── server.js                    # Main application entry point
└── README.md                    # Documentation
```

## Key Features Implemented

1. **Complete CRUD Operations** for both users and businesses
2. **JWT Authentication** with role-based access control
3. **Advanced Search & Filtering** with pagination
4. **Favorites System** with real-time count tracking
5. **Comprehensive Validation** for all inputs
6. **Professional Error Handling** with consistent responses
7. **Security Best Practices** (password hashing, rate limiting, CORS)
8. **Database Seeding** with sample data
9. **Logging & Monitoring** capabilities
10. **Production-Ready Structure** with proper separation of concerns

This backend provides a solid foundation for a digital yellow pages platform with all the essential features needed for a modern business directory application.
    