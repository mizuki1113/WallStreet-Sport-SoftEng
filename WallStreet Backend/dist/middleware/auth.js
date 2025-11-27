"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminOnly = adminOnly;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ormconfig_1 = require("../ormconfig");
const User_1 = require("../entities/User");
async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const token = header.replace('Bearer ', '');
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const repo = ormconfig_1.AppDataSource.getRepository(User_1.User);
        const user = await repo.findOne({ where: { id: payload.sub } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        next();
    }
    catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
