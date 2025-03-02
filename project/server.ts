import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import createCheckout from './src/api/payments/create-checkout';
import webhook from './src/pages/api/webhook';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/payments/create-checkout', (req, res, next) => {
  console.log('Received checkout request:', {
    headers: req.headers,
    body: req.body
  });
  createCheckout(req, res).catch(next);
});

app.post('/api/webhook', webhook);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server started at ${new Date().toISOString()}`);
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS enabled for:', ['http://localhost:5173', 'http://127.0.0.1:5173']);
}); 