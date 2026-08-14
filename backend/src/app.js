import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import fuelRoutes from './routes/fuelRoutes.js';
import lpgRoutes from './routes/lpgRoutes.js';
import quotaRoutes from './routes/quotaRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Secure headers with Helmet
app.use(helmet());

// Dynamic CORS configuration via environment variable
const getCorsOrigins = () => {
  const origins = [
    'https://fuelguard-ai-1.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  const envOrigin = process.env.CORS_ORIGIN;
  if (envOrigin) {
    // envOrigin could be a comma-separated list of origins
    const envOrigins = envOrigin.split(',').map(o => o.trim());
    for (const origin of envOrigins) {
      if (origin.startsWith('http') && !origins.includes(origin)) {
        origins.push(origin);
      }
    }
  }
  return origins;
};

export const corsOrigins = getCorsOrigins();

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Rate Limiters
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_WINDOW_MS || '60000', 10), // default 1 minute
  max: parseInt(process.env.API_RATE_LIMIT || '200', 10), // limit each IP per window
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_WINDOW_MS || '60000', 10), // default 1 minute
  max: parseInt(process.env.LOGIN_RATE_LIMIT || '5', 10), // default max 5 requests per minute
  message: { success: false, message: 'Brute-force protection: Too many login attempts. Please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use(express.json());

// Base health-check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'FuelGuard AI API server operational',
    timestamp: new Date().toISOString()
  });
});

// Route mountings
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/lpg', lpgRoutes);
app.use('/api/quotas', quotaRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// 404 API fallback handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
