/**
 * Format successful API responses
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {object} meta - Additional metadata (pagination, etc.)
 * @returns {object} Formatted response
 */
const formatSuccessResponse = (data = null, message = 'Success', meta = {}) => {
    return {
        success: true,
        message,
        data,
        ...meta,
        timestamp: new Date().toISOString()
    };
};

/**
 * Format error API responses
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {*} details - Additional error details
 * @returns {object} Formatted error response
 */
const formatErrorResponse = (message = 'An error occurred', code = 'UNKNOWN_ERROR', details = null) => {
    return {
        success: false,
        error: {
            message,
            code,
            details
        },
        timestamp: new Date().toISOString()
    };
};

/**
 * Format paginated responses
 * @param {Array} data - Response data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {object} Formatted paginated response
 */
const formatPaginatedResponse = (data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);

    return formatSuccessResponse(data, message, {
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    });
};

module.exports = {
    formatSuccessResponse,
    formatErrorResponse,
    formatPaginatedResponse
};