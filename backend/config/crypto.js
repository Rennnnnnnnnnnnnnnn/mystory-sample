import crypto from "crypto";

const IV_LENGTH = 12;

// 👉 lazy getters (FIX 1)
const getEncryptionKey = () =>
    Buffer.from(process.env.ENCRYPTION_KEY, "base64");

const getSecretSalt = () =>
    process.env.SECRET_SALT;

// ENCRYPT PLAINTEXT
export function encrypt(data) {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(data, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64")
    ].join(":");
}

// DECRYPT CIPHERTEXT
export function decrypt(data) {
    const [ivBase64, tagBase64, encryptedBase64] = data.split(":");

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(tagBase64, "base64");
    const encrypted = Buffer.from(encryptedBase64, "base64");

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
}

// Blind index (SHA-256 + secret salt)
export function blindIndex(value) {
    return crypto
        .createHash("sha256")
        .update(value + getSecretSalt())
        .digest("hex");
}


// Example: decrypt username
// const encryptedUsername = 
// `
// `

// function decryptUsername(){
//     try {
//         const username = decrypt(encryptedUsername);
//         console.log(username)
//     } catch (err) {
//         console.error("Failed to decrypt username:", err);
//     }
// }

// decryptUsername();