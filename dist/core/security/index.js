import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
const SALT_ROUNDS = 12;
export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};
export const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const generateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
};
export const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};
export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
export const sanitizeInput = (input) => {
    return input
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 1000);
};
//# sourceMappingURL=index.js.map