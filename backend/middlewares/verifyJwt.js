import jwt from 'jsonwebtoken';

export const verifyJwt = (token, secret) => {
    try {
        const decoded = jwt.verify(token, secret);
        return {
            valid: true,
            expired: false,
            decoded
        };
    } catch (error) {
        return {
            valid: false,
            expired: error.name === "TokenExpiredError",
            decoded: null
        };
    }
};