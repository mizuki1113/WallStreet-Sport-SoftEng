"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const ormconfig_1 = require("./ormconfig");
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', process.env.FRONTEND_URL || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Swagger documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WallStreet Basketball Court Booking API',
            version: '1.0.0',
            description: 'Backend API for WallStreet Sport basketball court reservation system',
            contact: {
                name: 'API Support'
            }
        },
        servers: [
            {
                url: process.env.BACKEND_URL || 'http://localhost:4000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Routes
app.use('/api', routes_1.default);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 4000;
// Initialize database and start server
ormconfig_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ Database connected successfully');
    console.log('📦 TypeORM entities loaded');
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
})
    .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
});
exports.default = app;
