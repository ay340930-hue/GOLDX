const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  dataset_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  source_type: { type: String, enum: ['BENCHMARK_DEMO', 'USER_UPLOAD', 'EXTERNAL_VERIFIED'], default: 'USER_UPLOAD' },
  filename: { type: String },
  upload_timestamp: { type: Date, default: Date.now },
  total_records: { type: Number, default: 0 },
  valid_records: { type: Number, default: 0 },
  rejected_records: { type: Number, default: 0 },
  health_score: { type: Number, default: 100.0 },
  symbols: [{ type: String }],
  date_range: {
    start: { type: String },
    end: { type: String }
  },
  validation_summary: { type: Object },
  provenance: {
    origin: { type: String, default: "MCX Bhavcopy Feed" },
    uploader: { type: String, default: "Analyst" },
    spec_version: { type: String, default: "v2024.1" },
    normalized_basis: { type: String, default: "₹ / 10g (999 fineness)" }
  }
}, { timestamps: true });

module.exports = mongoose.model('Dataset', DatasetSchema);
