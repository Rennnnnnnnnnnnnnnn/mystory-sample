import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import db from "../config/db.js";
import { verifyJwt } from "./verifyJwt.js";

dotenv.config();
const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const authenticate = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Unauthorized: No token provided."
        });
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const result = verifyJwt(
            accessToken,
            process.env.JWT_SECRET_ACCESS_KEY
        );

        if (result.valid) {
            req.userData = result.decoded;
            return next();
        }

        return res.status(401).json({
            error: "Unauthorized: Invalid or expired token."
        });

    } catch (err) {
        console.error("Authentication error:", err);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

export default authenticate;