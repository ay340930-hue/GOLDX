const fs = require('fs');
const path = require('path');
const { executeAnalytics } = require('../services/pythonBridge');
const Dataset = require('../models/Dataset');

// In-memory dataset store fallback
const DATASET_STORE = new Map();

// Helper to register demo dataset
function registerInitialBenchmark() {
  const demoPath = path.resolve(__dirname, '..', '..', '..', 'demo-data', 'mcx_gold_benchmark_demo.csv');
  if (fs.existsSync(demoPath)) {
    DATASET_STORE.set('benchmark_demo', {
      dataset_id: 'benchmark_demo',
      name: 'MCX Gold Futures Benchmark 2024 (Synthetic)',
      source_type: 'BENCHMARK_DEMO',
      filename: 'mcx_gold_benchmark_demo.csv',
      filepath: demoPath,
      upload_timestamp: new Date('2024-12-30T10:00:00Z'),
      total_records: 1000,
      valid_records: 1000,
      rejected_records: 0,
      health_score: 100.0,
      symbols: ['GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'],
      date_range: { start: '2024-01-02', end: '2024-12-30' },
      provenance: {
        origin: "Deterministic MCX Synthetic Benchmark Feed",
        uploader: "GOLDX Quantitative Research Team",
        spec_version: "v2024.1",
        normalized_basis: "₹ / 10g (999 fineness)"
      },
      validation_summary: {
        total_errors: 0,
        duplicate_count: 0,
        anomalies_seeded: [
          "Post-Budget Sovereign Coin Premium (July 2024, Guinea)",
          "Dhanteras Micro-Contract Physical Squeeze (Oct 2024, Petal)",
          "Pre-Monsoon Delivery Clearing Discount (May 2024)"
        ]
      }
    });
  }
}
registerInitialBenchmark();

let activeDatasetId = 'benchmark_demo';

async function getDatasets(req, res) {
  try {
    let datasets = [];
    try {
      datasets = await Dataset.find().sort({ createdAt: -1 });
    } catch (e) {
      // In-memory fallback
      datasets = Array.from(DATASET_STORE.values());
    }

    if (datasets.length === 0) {
      datasets = Array.from(DATASET_STORE.values());
    }

    res.json({
      success: true,
      active_dataset_id: activeDatasetId,
      datasets: datasets
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function loadDemoDataset(req, res) {
  try {
    const demoPath = path.resolve(__dirname, '..', '..', '..', 'demo-data', 'mcx_gold_benchmark_demo.csv');
    const loadRes = await executeAnalytics('load_data', {
      csv_path: demoPath,
      dataset_id: 'benchmark_demo'
    });

    activeDatasetId = 'benchmark_demo';

    const datasetInfo = DATASET_STORE.get('benchmark_demo') || {
      dataset_id: 'benchmark_demo',
      name: 'MCX Gold Benchmark Demo',
      source_type: 'BENCHMARK_DEMO',
      total_records: 1000,
      valid_records: 1000,
      health_score: 100.0
    };

    res.json({
      success: true,
      message: "Deterministic synthetic benchmark dataset loaded successfully into analytics cache",
      active_dataset_id: activeDatasetId,
      details: datasetInfo,
      analytics_status: loadRes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function uploadDataset(req, res) {
  try {
    if (!req.file && !req.body.csv_text) {
      return res.status(400).json({ success: false, error: "No CSV file or csv_text provided" });
    }

    let csvPath = null;
    let csvText = null;
    let filename = "custom_upload.csv";

    if (req.file) {
      csvPath = req.file.path;
      filename = req.file.originalname;
    } else {
      csvText = req.body.csv_text;
      filename = req.body.filename || "pasted_data.csv";
    }

    const valRes = await executeAnalytics('validate', {
      csv_path: csvPath,
      csv_text: csvText
    });

    const datasetId = `ds_${Date.now()}`;
    const datasetDoc = {
      dataset_id: datasetId,
      name: filename.replace('.csv', ''),
      source_type: 'USER_UPLOAD',
      filename: filename,
      filepath: csvPath,
      upload_timestamp: new Date(),
      total_records: valRes.total_rows || 0,
      valid_records: valRes.valid_rows || 0,
      rejected_records: valRes.rejected_rows || 0,
      health_score: valRes.health_score || 0.0,
      symbols: Object.keys(valRes.contract_counts || {}),
      date_range: valRes.summary?.date_range || {},
      provenance: {
        origin: "User Uploaded CSV",
        uploader: "Current Session",
        spec_version: "v2024.1",
        normalized_basis: "₹ / 10g (999 fineness)"
      },
      validation_summary: valRes.summary || {},
      errors: valRes.errors || []
    };

    // Save in memory
    DATASET_STORE.set(datasetId, datasetDoc);

    // Save in Mongo if available
    try {
      await Dataset.create(datasetDoc);
    } catch (e) {}

    // If valid, load into active analytics cache
    if (valRes.is_valid) {
      await executeAnalytics('load_data', {
        csv_path: csvPath,
        csv_text: csvText,
        dataset_id: datasetId
      });
      activeDatasetId = datasetId;
    }

    res.json({
      success: true,
      dataset_id: datasetId,
      is_valid: valRes.is_valid,
      health_score: valRes.health_score,
      total_rows: valRes.total_rows,
      valid_rows: valRes.valid_rows,
      rejected_rows: valRes.rejected_rows,
      contract_counts: valRes.contract_counts,
      errors_count: (valRes.errors || []).length,
      sample_errors: (valRes.errors || []).slice(0, 20),
      summary: valRes.summary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getDatasetQuality(req, res) {
  try {
    const id = req.params.id || activeDatasetId;
    let dataset = DATASET_STORE.get(id);

    if (!dataset) {
      try {
        dataset = await Dataset.findOne({ dataset_id: id });
      } catch (e) {}
    }

    if (!dataset && id === 'benchmark_demo') {
      dataset = DATASET_STORE.get('benchmark_demo');
    }

    if (!dataset) {
      return res.status(404).json({ success: false, error: `Dataset '${id}' not found` });
    }

    res.json({
      success: true,
      dataset_id: dataset.dataset_id,
      name: dataset.name,
      health_score: dataset.health_score,
      source_type: dataset.source_type,
      total_records: dataset.total_records,
      valid_records: dataset.valid_records,
      rejected_records: dataset.rejected_records,
      symbols: dataset.symbols,
      date_range: dataset.date_range,
      provenance: dataset.provenance,
      validation_summary: dataset.validation_summary,
      errors: dataset.errors || []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function downloadValidationReport(req, res) {
  try {
    const id = req.params.id || activeDatasetId;
    let dataset = DATASET_STORE.get(id);
    if (!dataset) {
      try {
        dataset = await Dataset.findOne({ dataset_id: id });
      } catch (e) {}
    }

    if (!dataset) {
      return res.status(404).json({ success: false, error: "Dataset not found" });
    }

    const report = {
      report_title: `GOLDX Data Ingestion Validation Report - ${dataset.name}`,
      generated_at: new Date().toISOString(),
      dataset_id: dataset.dataset_id,
      health_score: dataset.health_score,
      summary: {
        total_observations: dataset.total_records,
        accepted_observations: dataset.valid_records,
        rejected_observations: dataset.rejected_records,
        symbols_detected: dataset.symbols,
        date_range: dataset.date_range
      },
      diagnostics: dataset.validation_summary,
      row_level_errors: dataset.errors || []
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="goldx_validation_report_${dataset.dataset_id}.json"`);
    res.send(JSON.stringify(report, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getDatasets,
  loadDemoDataset,
  uploadDataset,
  getDatasetQuality,
  downloadValidationReport
};
