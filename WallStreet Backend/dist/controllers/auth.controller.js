"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.createAdmin = createAdmin;
const AuthService_1 = require("../services/AuthService");
const authService = new AuthService_1.AuthService();
async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const result = await authService.login(username, password);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function createAdmin(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const result = await authService.createAdmin(username, password);
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
