import { verifyJwt } from "./verifyJwt.js";
import dotenv from "dotenv";

dotenv.config();

const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(); // no token, but allowed
        }

        const token = authHeader.split(" ")[1];

        const result = verifyJwt(token, process.env.JWT_SECRET_ACCESS_KEY);

        if (result.valid) {
            req.userData = result.decoded;
        }

        // if invalid/expired → just ignore (optional auth)
        return next();

    } catch (err) {
        console.error("optionalAuthenticate error:", err);
        return next(); // never block request
    }
};

export default optionalAuthenticate;