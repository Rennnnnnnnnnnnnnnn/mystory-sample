import db from '../config/db.js';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { blindIndex, encrypt, decrypt } from "../config/crypto.js";
import crypto from "crypto";
dotenv.config();

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyUser = (req, res) => {
    res.json({
        message: 'Access token refreshed successfully',
    });
};

// REGISTER USER
export const createUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username and password are required!"
        });
    }

    try {
        const usernameIndex = blindIndex(username);

        const existingUsername = await db.query(
            `SELECT user_id FROM users WHERE username_index = $1`,
            [usernameIndex]
        );

        if (existingUsername.rows.length > 0) {
            return res.status(409).json({
                error: "Username already exists"
            });
        }

        let encryptedEmail = null;
        let emailIndex = null;

        if (email) {
            emailIndex = blindIndex(email);
            encryptedEmail = encrypt(email);

            const existingEmail = await db.query(
                `SELECT user_id FROM users WHERE email_index = $1`,
                [emailIndex]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(409).json({
                    error: "Email already exists"
                });
            }
        }

        const passwordWithPepper = password + process.env.PEPPER_KEY;
        const hashedPassword = await argon2.hash(passwordWithPepper);
        const encryptedUsername = encrypt(username);

        await db.query(
            `
            INSERT INTO users 
                (username_encrypted, username_index, email_encrypted, email_index, password)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                encryptedUsername,
                usernameIndex,
                encryptedEmail,
                emailIndex,
                hashedPassword
            ]
        );

        return res.status(201).json({
            message: "Account registered successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};


// LOGIN USER
export const loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password are required!" });
    }

    try {
        const usernameIndex = blindIndex(identifier);
        const emailIndex = blindIndex(identifier);

        const result = await db.query(
            'SELECT * FROM users WHERE username_index = $1 OR email_index = $2',
            [usernameIndex, emailIndex]
        );

        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials!" });
        }

        const user = rows[0];

        if (user.user_id === 0) {
            throw new Error("Invalid account");
        }

        const valid = await argon2.verify(
            user.password,
            password + process.env.PEPPER_KEY
        );

        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials!" });
        }

        // Decrypt username and email
        const decryptedUsername = decrypt(user.username_encrypted);
        const decryptedEmail = user.email_encrypted
            ? decrypt(user.email_encrypted)
            : null;

        const userData = {
            user_id: user.user_id,
            username: decryptedUsername,
            email: decryptedEmail
        };

        const accessToken = jwt.sign(userData, process.env.JWT_SECRET_ACCESS_KEY, {
            expiresIn: '1m',
            algorithm: 'HS256'
        });

        const refreshToken = jwt.sign(userData, process.env.JWT_SECRET_REFRESH_KEY, {
            expiresIn: '7d',
            algorithm: 'HS256'
        });

        const refreshTokenHash = hashToken(refreshToken);

        await db.query(
            `INSERT INTO refresh_tokens (
                user_id,
                token_hash,
                expires_at,
                revoked
            )
            VALUES ($1, $2, NOW() + interval '7 days', false)`,
            [user.user_id, refreshTokenHash]
        );

      return res.status(200).json({
            message: "Login successful!",
            accessToken,
            refreshToken,
            userData
    });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// LOGOUT USER
export const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            const hashedRefresh = hashToken(refreshToken);

            await db.query(
                `DELETE FROM refresh_tokens
                 WHERE token_hash = $1`,
                [hashedRefresh]
            );
        }

        return res.status(200).json({
            message: "Logout successful!"
        });

    } catch (error) {
        console.error("Error during logout:", error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};


// REFRESH ACCESS TOKEN IF VALID REFRESH TOKEN
export const refreshUserToken = async (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {

        console.log("❌ No refresh token provided");

        return res.status(401).json({
            error: "No refresh token provided"
        });
    }

    try {

        console.log("🔍 Verifying refresh token...");

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET_REFRESH_KEY
        );

        console.log("✅ Refresh token JWT valid");

        const refreshTokenHash = hashToken(refreshToken);

        console.log("🔍 Checking refresh token in database...");

        const result = await db.query(
            `SELECT * FROM refresh_tokens
             WHERE token_hash = $1
             AND revoked = false
             AND expires_at > NOW()`,
            [refreshTokenHash]
        );

        if (result.rows.length === 0) {

            console.log("❌ Refresh token not found in DB");

            return res.status(401).json({
                error: "Invalid session"
            });
        }

        console.log("✅ Refresh token found in DB");

        const newAccessToken = jwt.sign(
            {
                user_id: decoded.user_id,
                username: decoded.username,
                email: decoded.email
            },
            process.env.JWT_SECRET_ACCESS_KEY,
            {
                expiresIn: "5m",
                algorithm: "HS256"
            }
        );

        console.log("🆕 New access token issued");

        return res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {

        console.log("❌ Refresh token verification failed");

        console.error(error);

        return res.status(401).json({
            error: "Invalid refresh token"
        });
    }
};




// SEND RESET PASSWORD
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email required" });
    }

    try {

        const emailIndex = blindIndex(email);

        const [rows] = await db.query("SELECT user_id FROM users WHERE email_index = ?", [emailIndex]);

        // Always return same response to avoid enumeration
        if (rows.length === 0) {
            return res.json({ message: "Reset link has been sent to the email." });
        }

        const user = rows[0];
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = await argon2.hash(token);
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await db.query(`UPDATE users SET reset_token_hash = ?, reset_token_expiry = ?WHERE user_id = ?`, [tokenHash, expiry, user.user_id]);

        const resetLink = `http://localhost:5173/reset-password/${token}`;

        return res.json({ message: "Reset link has been sent to the email." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
};


