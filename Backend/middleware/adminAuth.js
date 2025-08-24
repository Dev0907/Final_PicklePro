import { authenticateToken } from './auth.js';

/**
 * Middleware to verify if the authenticated user is an admin
 * Must be used after the authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateAdmin = (req, res, next) => {
    // First verify the token
    return authenticateToken(req, res, () => {
        // Check if user has admin role
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
    });
};

export default {
    authenticateAdmin
};
