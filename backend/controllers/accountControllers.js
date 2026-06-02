import db from '../config/db.js';
import dotenv from 'dotenv';
import argon2 from 'argon2';

import { blindIndex, encrypt, decrypt } from "../config/crypto.js";

dotenv.config();

// UPDATE USERNAME
export const updateUsername = async (req, res) => {
    const { username } = req.body;
    const userId = req.userData?.user_id;

    if (!username) {
        return res.status(400).json({ error: "Username is required." });
    }

    try {
        const usernameIndex = blindIndex(username);

        // 🔍 Check if username exists (excluding current user)
        const existingResult = await db.query(
            `SELECT user_id 
             FROM users 
             WHERE username_index = $1 
             AND user_id != $2`,
            [usernameIndex, userId]
        );

        if (existingResult.rowCount > 0) {
            return res.status(409).json({
                error: "Username already exists."
            });
        }

        const encryptedUsername = encrypt(username);

        // ✏️ Update username
        await db.query(
            `UPDATE users 
             SET username_encrypted = $1, username_index = $2 
             WHERE user_id = $3`,
            [encryptedUsername, usernameIndex, userId]
        );

        return res.status(200).json({
            message: "Username updated successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};

// UPDATE EMAIL
export const updateEmail = async (req, res) => {
    const { email } = req.body;
    const userId = req.userData?.user_id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format." });
    }

    try {
        const emailIndex = blindIndex(email);

        // 🔍 Check if email exists (excluding current user)
        const existingResult = await db.query(
            `SELECT user_id 
             FROM users 
             WHERE email_index = $1 
             AND user_id != $2`,
            [emailIndex, userId]
        );

        if (existingResult.rowCount > 0) {
            return res.status(409).json({
                error: "Email already exists."
            });
        }

        const encryptedEmail = encrypt(email);

        // ✏️ Update email
        await db.query(
            `UPDATE users 
             SET email_encrypted = $1, email_index = $2 
             WHERE user_id = $3`,
            [encryptedEmail, emailIndex, userId]
        );

        return res.status(200).json({
            message: "Email updated successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};

// UPDATE PASSWORD
export const updatePassword = async (req, res) => {
    const userId = req.userData?.user_id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized." });
    }

    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            error: "Old and new password are required."
        });
    }

    try {
        // 🔍 Get current password hash
        const { rows } = await db.query(
            `SELECT password 
             FROM users 
             WHERE user_id = $1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const storedHash = rows[0].password;
        const oldPasswordWithPepper = oldPassword + process.env.PEPPER_KEY;

        const isValid = await argon2.verify(
            storedHash,
            oldPasswordWithPepper
        );

        if (!isValid) {
            return res.status(400).json({
                error: "Current password is incorrect."
            });
        }

        const newPasswordWithPepper = newPassword + process.env.PEPPER_KEY;
        const newHashedPassword = await argon2.hash(newPasswordWithPepper);

        // ✏️ Update password
        await db.query(
            `UPDATE users 
             SET password = $1 
             WHERE user_id = $2`,
            [newHashedPassword, userId]
        );

        return res.status(200).json({
            message: "Password updated successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error."
        });
    }
};

// DELETE ACCOUNT
export const deleteAccount = async (req, res) => {
    const user_id = req.userData?.user_id;
    const { password, keepPublicPosts } = req.body;

    if (!user_id) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    if (!password) {
        return res.status(400).json({
            error: "Password required"
        });
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        // 🔍 Get user password hash
        const userResult = await client.query(
            `
            SELECT password
            FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        if (userResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "User not found"
            });
        }

        // 🔐 Verify password
        const isMatch = await argon2.verify(
            userResult.rows[0].password,
            password + process.env.PEPPER_KEY
        );

        if (!isMatch) {
            await client.query("ROLLBACK");

            return res.status(401).json({
                error: "Incorrect password"
            });
        }

        // 🗑 Delete private posts
        await client.query(
            `
            DELETE FROM posts
            WHERE user_id = $1
            AND audience = 'Private'
            `,
            [user_id]
        );

        // 🌍 Handle public posts
        if (keepPublicPosts) {

            // anonymize ownership
            await client.query(
                `
                UPDATE posts
                SET user_id = 0
                WHERE user_id = $1
                AND audience = 'public'
                `,
                [user_id]
            );

        } else {

            // delete public posts
            await client.query(
                `
                DELETE FROM posts
                WHERE user_id = $1
                AND audience = 'public'
                `,
                [user_id]
            );
        }

        // 🗑 Delete user
        await client.query(
            `
            DELETE FROM users
            WHERE user_id = $1
            `,
            [user_id]
        );

        await client.query("COMMIT");

        // 🍪 Clear auth cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        };

        res.clearCookie("refreshToken", cookieOptions);
        res.clearCookie("accessToken", cookieOptions);

        return res.status(200).json({
            message: "Account deleted successfully"
        });

    } catch (err) {

        await client.query("ROLLBACK");

        console.error("Delete Account Error:", err);

        return res.status(500).json({
            error: err.message || "Server error during account deletion"
        });

    } finally {

        client.release();

    }
};

// GET CURRENT USER INFO
export const getCurrentUser = async (req, res) => {
    const userId = req.userData?.user_id;

    if (!userId) {
        return res.status(401).json({ error: "No user ID" });
    }

    try {
        const { rows } = await db.query(
            `SELECT user_id, username_encrypted, email_encrypted 
             FROM users 
             WHERE user_id = $1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = rows[0];

        const username = decrypt(user.username_encrypted);
        const email = user.email_encrypted
            ? decrypt(user.email_encrypted)
            : null;

        return res.status(200).json({
            user_id: user.user_id,
            username,
            email
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
