const { executeAnalytics } = require('../services/pythonBridge');
const Backtest = require('../models/Backtest');

const BACKTEST_CACHE = new Map();

async function runBacktest(req, res) {
  try {
    const symbol_a = req.body.symbol_a || 'GOLDM';
    const symbol_b = req.body.symbol_b || 'GOLDTEN';
    const lookback_window = parseInt(req.body.lookback_window) || 30;

    const config = {
      entry_threshold: parseFloat(req.body.entry_threshold) || 2.0,
      exit_threshold: parseFloat(req.body.exit_threshold) || 0.5,
      stop_loss_threshold: parseFloat(req.body.stop_loss_threshold) || 3.5,
      max_hold_days: parseInt(req.body.max_hold_days) || 15,
      expiry_cutoff_dte: parseInt(req.body.expiry_cutoff_dte) || 5,
      min_volume: parseInt(req.body.min_volume) || 50,
      round_trip_cost: parseFloat(req.body.round_trip_cost) || 90.0,
      fold_train_size: parseInt(req.body.fold_train_size) || 60,
      fold_test_size: parseInt(req.body.fold_test_size) || 20
    };

    const pyRes = await executeAnalytics('backtest', {
      symbol_a,
      symbol_b,
      lookback_window,
      config
    });

    if (pyRes.error) {
      return res.status(400).json({ success: false, error: pyRes.error });
    }

    const backtestId = `bt_${Date.now()}`;
    const resultDoc = {
      backtest_id: backtestId,
      name: `${symbol_a} vs ${symbol_b} Walk-Forward Backtest`,
      dataset_id: req.body.dataset_id || "active",
      symbol_a,
      symbol_b,
      timestamp: new Date(),
      config,
      metrics: pyRes.metrics || {},
      folds: pyRes.folds || [],
      trades: pyRes.trades || [],
      equity_curve: pyRes.equity_curve || [],
      disclaimer: pyRes.disclaimer
    };

    BACKTEST_CACHE.set(backtestId, resultDoc);

    try {
      await Backtest.create(resultDoc);
    } catch (e) {}

    res.json({
      success: true,
      backtest_id: backtestId,
      ...resultDoc
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getBacktestById(req, res) {
  try {
    const id = req.params.id;
    let bt = BACKTEST_CACHE.get(id);

    if (!bt) {
      try {
        bt = await Backtest.findOne({ backtest_id: id });
      } catch (e) {}
    }

    if (!bt) {
      return res.status(404).json({ success: false, error: `Backtest run '${id}' not found` });
    }

    res.json({ success: true, ...bt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  runBacktest,
  getBacktestById
};
