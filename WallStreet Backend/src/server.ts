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

// MANUAL CORS MIDDLEWARE
app.use((req, res, next) => {
  // Set CORS headers for ALL responses (including errors)
  res.header('Access-Control-Allow-Origin', 'https://wallstreetsport.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// keep existing cors
app.use(cors({
  origin: "https://wallstreetsport.vercel.app",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Routes
app.use('/api', routes);

// Error handler (must be last)
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