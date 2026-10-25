const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'goldx_uploads'),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

const { getContracts } = require('../controllers/contractController');
const {
  getDatasets,
  loadDemoDataset,
  uploadDataset,
  getDatasetQuality,
  downloadValidationReport
} = require('../controllers/datasetController');
const {
  getPrices,
  getRelativeValue,
  getAnomalies,
  getLiquidity,
  getMethodology
} = require('../controllers/analyticsController');
const {
  runBacktest,
  getBacktestById
} = require('../controllers/backtestController');
const { executeAnalytics } = require('../services/pythonBridge');
const { getDbStatus } = require('../config/db');

// Health Check
router.get('/health', async (req, res) => {
  let pyStatus = { status: "CHECKING" };
  try {
    pyStatus = await executeAnalytics('health', {});
  } catch (e) {
    pyStatus = { status: "DEGRADED", error: e.message };
  }

  res.json({
    status: "HEALTHY",
    service: "GOLDX Intelligence API Server",
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
    analytics_engine: pyStatus,
    active_scope: "MCX Gold Futures (GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL)"
  });
});

// Contracts Master
router.get('/contracts', getContracts);

// Datasets & Data Quality
router.get('/datasets', getDatasets);
router.post('/datasets/demo', loadDemoDataset);
router.post('/datasets/upload', upload.single('file'), uploadDataset);
router.get('/datasets/:id/quality', getDatasetQuality);
router.get('/datasets/:id/report', downloadValidationReport);

// Quantitative Analytics
router.get('/prices', getPrices);
router.get('/relative-value', getRelativeValue);
router.get('/analytics/anomalies', getAnomalies);
router.get('/analytics/liquidity', getLiquidity);

// Walk-Forward Backtesting
router.post('/backtests/run', runBacktest);
router.get('/backtests/:id', getBacktestById);

// Methodology & Documentation
router.get('/methodology', getMethodology);

module.exports = router;
