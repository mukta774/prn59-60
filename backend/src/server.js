/**
 * Main Express Server Entry Point
 * Vaccine Hesitancy Assessment & Response System
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust proxy (required for Render, Heroku, and other cloud platforms)
app.set('trust proxy', 1);

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: process.env.CORS_ORIGIN })); // CORS
app.use(express.json({ limit: '10mb' })); // JSON parser
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Routes
app.use('/api/survey', require('./routes/surveyRoutes'));
app.use('/api/results', require('./routes/resultsRoutes'));
app.use('/api/myths', require('./routes/mythsRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/institutional', require('./routes/institutionalRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
