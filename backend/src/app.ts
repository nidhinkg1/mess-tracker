import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import exceptionRoutes from './routes/exception.routes';
import billingRoutes from './routes/billing.routes';
import shareRoutes from './routes/share.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Explicit allowed origins for CORS with credentials enabled
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server or tests) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || (!isProduction && origin.startsWith('http://localhost:'))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy error: Origin ${origin} is not allowed`));
      }
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());

// Strict CSRF Origin Verification for state-changing requests in production
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin && isProduction && process.env.FRONTEND_URL) {
      if (origin !== process.env.FRONTEND_URL) {
        res.status(403).json({ error: 'CSRF protection: Invalid request origin' });
        return;
      }
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/meal-exceptions', exceptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api', shareRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Mess Expense Tracker API is running' });
});

// Centralized error handler
app.use(errorHandler);

export default app;
