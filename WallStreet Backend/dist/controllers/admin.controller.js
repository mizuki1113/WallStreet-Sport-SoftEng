"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = require("../utils/validator");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password";
const adminLogin = (req, res) => {
    try {
        const { username, password } = validator_1.adminLoginSchema.parse(req.body);
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ username, role: "admin" }, process.env.JWT_SECRET || "secret", { expiresIn: "2h" });
        res.json({ token });
    }
    catch (err) {
        res.status(400).json({ errors: err.errors });
    }
};
exports.adminLogin = adminLogin;
