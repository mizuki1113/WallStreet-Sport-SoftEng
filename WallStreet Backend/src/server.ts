import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { AppDataSource } from './ormconfig';
import { errorHandler } from './middleware/errorHandler';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app = express();

// CORS Middleware
app.use(cors({
  origin: "https://wallstreetsport.vercel.app",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ADD TEST ROUTE HERE - after CORS but before main routes
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS test', timestamp: new Date() });
});

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

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Main routes
app.use('/api', routes);

// Error handler 
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Initialize database and start server
AppDataSource.initialize()
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

export default app;