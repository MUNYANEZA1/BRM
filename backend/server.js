const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your deployment platform (Render/Vercel) or .env file');
  process.exit(1);
}

// If running behind a proxy (Render, Heroku, Vercel serverless), trust proxy headers
// so rate-limiting and IP detection work correctly.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
// Use centralized CORS middleware (see middleware/cors.js)
const customCors = require('./middleware/cors');
app.use(customCors);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable caching for API endpoints to ensure real-time updates
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Logging middleware
app.use(morgan('combined'));

// MongoDB connection - validate URI scheme early to provide clearer errors
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
  console.error('❌ CRITICAL: Invalid or missing MONGODB_URI');
  console.error('   Expected format: mongodb://... or mongodb+srv://...');
  console.error('   Current value:', mongoUri ? `${mongoUri.substring(0, 20)}...` : 'not set');
  process.exit(1);
} else {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Check that your MONGODB_URI is correct and the database is accessible');
    process.exit(1);
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bar/Restaurant Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

// simple health check including database status
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    dbState,
    dbStateDesc: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown'
  });
});

// Import routes (will be created in next phases)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/settings', require('./routes/settings'));
// app.use('/api/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  // log some key env variables (mask sensitive values)
  console.log('MONGODB_URI', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/)(.*)/, '$1***') : 'not set');
  console.log('JWT_SECRET', process.env.JWT_SECRET ? '***' : 'not set');
  console.log('FRONTEND_URL', process.env.FRONTEND_URL || 'not set');
});

module.exports = app;

