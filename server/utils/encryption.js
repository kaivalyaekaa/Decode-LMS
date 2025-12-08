const crypto = require('crypto');

// Ensure you have ENCRYPTION_KEY in .env (32 chars) and IV_LENGTH (16)
const algorithm = 'aes-256-cbc';
const ivLength = 16;

// Derive a 32-byte key from the env var (hashing ensures exact length)
const rawKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback_secret_key';
const secretKey = crypto.createHash('sha256').update(String(rawKey)).digest();

const encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        // If decryption fails (old data), return original
        return text;
    }
};

const hashData = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

module.exports = { encrypt, decrypt, hashData };
