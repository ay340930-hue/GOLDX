const mongoose = require('mongoose');

const BacktestSchema = new mongoose.Schema({
  backtest_id: { type: String, required: true, unique: true },
  name: { type: String, default: "Walk-Forward Simulation" },
  dataset_id: { type: String, required: true },
  symbol_a: { type: String, required: true },
  symbol_b: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  config: {
    lookback_window: { type: Number, default: 30 },
    entry_threshold: { type: Number, default: 2.0 },
    exit_threshold: { type: Number, default: 0.5 },
    stop_loss_threshold: { type: Number, default: 3.5 },
    max_hold_days: { type: Number, default: 15 },
    expiry_cutoff_dte: { type: Number, default: 5 },
    round_trip_cost: { type: Number, default: 90.0 },
    fold_train_size: { type: Number, default: 60 },
    fold_test_size: { type: Number, default: 20 }
  },
  metrics: {
    total_trades: { type: Number, default: 0 },
    winning_trades: { type: Number, default: 0 },
    losing_trades: { type: Number, default: 0 },
    win_rate_pct: { type: Number, default: 0.0 },
    total_gross_pnl: { type: Number, default: 0.0 },
    total_fees_paid: { type: Number, default: 0.0 },
    total_net_pnl: { type: Number, default: 0.0 },
    max_drawdown: { type: Number, default: 0.0 },
    profit_factor: { type: Number, default: 0.0 },
    average_hold_days: { type: Number, default: 0.0 }
  },
  folds: [{ type: Object }],
  trades: [{ type: Object }],
  equity_curve: [{ type: Object }],
  disclaimer: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Backtest', BacktestSchema);
