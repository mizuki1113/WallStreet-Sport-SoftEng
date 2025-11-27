"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./entities/User");
const TimeSlot_1 = require("./entities/TimeSlot");
const Booking_1 = require("./entities/Booking");
const Transaction_1 = require("./entities/Transaction");
require("dotenv/config");

exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    // THIS LINE IS THE FIX
    url: process.env.DATABASE_URL, 
    
    // Everything below this line remains mostly the same
    entities: [User_1.User, TimeSlot_1.TimeSlot, Booking_1.Booking, Transaction_1.Transaction],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});