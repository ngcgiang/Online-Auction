const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key-change-in-production';

/**
 * Middleware to verify JWT Access Token
 * Extracts token from Authorization header: "Bearer <token>"
 * Attaches decoded user info to req.user
 */
const verifyAccessToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: 'Access token has expired'
                    });
                }
                
                return res.status(403).json({
                    success: false,
                    message: 'Invalid access token'
                });
            }

            // Attach user info to request
            req.user = decoded;
            next();
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error verifying token'
        });
    }
};

/**
 * Middleware to check user role
 * Usage: checkRole(['admin', 'seller'])
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource'
            });
        }

        next();
    };
};

module.exports = {
    verifyAccessToken,
    checkRole
};
