require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const { executeAnalytics } = require('./services/pythonBridge');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Netlify dev/prod servers and any origin
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[GOLDX API] ${req.method} ${req.path}`);
  }
  next();
});

// Mount API routes
app.use('/api', apiRoutes);

// Serve static frontend build if dist directory exists
const frontendDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Root informational endpoint
  app.get('/', (req, res) => {
    res.json({
      name: "GOLDX — Explainable Cross-Contract Gold Intelligence Backend",
      hackathon: "Hack in Hills '26 - Problem Statement 03",
      status: "ONLINE",
      endpoints: {
        health: "/api/health",
        contracts: "/api/contracts",
        datasets: "/api/datasets",
        demo_dataset: "POST /api/datasets/demo",
        prices: "/api/prices",
        relative_value: "/api/relative-value?symbol_a=GOLDM&symbol_b=GOLDGUINEA",
        anomalies: "/api/analytics/anomalies",
        liquidity: "/api/analytics/liquidity",
        backtest: "POST /api/backtests/run",
        methodology: "/api/methodology"
      }
    });
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[GOLDX Error Handler]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

// Initialize server
async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` GOLDX Backend API Server running on port ${PORT}`);
    console.log(` Base URL: http://localhost:${PORT}`);
    console.log(` Health:   http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  // Preload benchmark dataset in Python engine
  try {
    const demoPath = path.resolve(__dirname, '..', '..', 'demo-data', 'mcx_gold_benchmark_demo.csv');
    await executeAnalytics('load_data', {
      csv_path: demoPath,
      dataset_id: 'benchmark_demo'
    });
    console.log('[GOLDX Preloader] Benchmark dataset preloaded into analytics engine');
  } catch (e) {
    console.warn('[GOLDX Preloader] Preload deferred to first request:', e.message);
  }
}

startServer();

module.exports = app;
