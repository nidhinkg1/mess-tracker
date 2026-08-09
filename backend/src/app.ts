import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import exceptionRoutes from './routes/exception.routes';
import billingRoutes from './routes/billing.routes';
import shareRoutes from './routes/share.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
