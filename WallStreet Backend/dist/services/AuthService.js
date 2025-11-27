"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ormconfig_1 = require("../ormconfig");
const User_1 = require("../entities/User");
class AuthService {
    constructor() {
        this.userRepo = ormconfig_1.AppDataSource.getRepository(User_1.User);
    }
    async login(username, password) {
        const user = await this.userRepo.findOne({ where: { username } });
        if (!user) {
            throw { status: 401, message: 'Invalid credentials' };
        }
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw { status: 401, message: 'Invalid credentials' };
        }
        const token = jsonwebtoken_1.default.sign({ sub: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    }
    async createAdmin(username, password) {
        const existing = await this.userRepo.findOne({ where: { username } });
        if (existing) {
            throw { status: 409, message: 'Username already exists' };
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = this.userRepo.create({
            username,
            passwordHash,
            role: 'admin'
        });
        await this.userRepo.save(user);
        return { success: true, userId: user.id };
    }
}
exports.AuthService = AuthService;
