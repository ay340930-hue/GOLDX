const { executeAnalytics } = require('../services/pythonBridge');

async function getPrices(req, res) {
  try {
    const symbol = req.query.symbol || 'ALL';
    const limit = parseInt(req.query.limit) || 1000;
    const pyRes = await executeAnalytics('prices', { symbol, limit });
    res.json({ success: true, ...pyRes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getRelativeValue(req, res) {
  try {
    const symbol_a = req.query.symbol_a || 'GOLDM';
    const symbol_b = req.query.symbol_b || 'GOLDTEN';
    const lookback_window = parseInt(req.query.lookback_window) || 30;

    if (symbol_a === symbol_b) {
      return res.status(400).json({
        success: false,
        error: 'Select two different contracts to calculate relative value.'
      });
    }

    const pyRes = await executeAnalytics('relative_value', {
      symbol_a,
      symbol_b,
      lookback_window
    });

    if (pyRes.error) {
      return res.status(400).json({ success: false, error: pyRes.error });
    }

    res.json({ success: true, ...pyRes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getAnomalies(req, res) {
  try {
    const symbol_a = req.query.symbol_a || 'GOLDM';
    const symbol_b = req.query.symbol_b || 'GOLDGUINEA';
    const lookback_window = parseInt(req.query.lookback_window) || 30;
    const threshold = parseFloat(req.query.threshold) || 2.0;
    const cost_per_10g = parseFloat(req.query.cost_per_10g) || 90.0;
    const all_pairs = req.query.all_pairs === 'true';

    const pyRes = await executeAnalytics('anomalies', {
      symbol_a,
      symbol_b,
      lookback_window,
      threshold,
      cost_per_10g,
      all_pairs
    });

    res.json({ success: true, ...pyRes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getLiquidity(req, res) {
  try {
    const pyRes = await executeAnalytics('liquidity', {});
    res.json({ success: true, ...pyRes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function getMethodology(req, res) {
  res.json({
    success: true,
    platform: "GOLDX Commodity Derivatives Intelligence",
    version: "2024.1",
    theme_alignment: "Hack in Hills '26 - Problem Statement 03: Commodity Derivatives Intelligence",
    methodology: {
      normalization: {
        title: "Defensible Common Analytical Unit Normalization",
        target_unit: "10 grams",
        target_purity: 999,
        formula: "NormalizedPrice = (QuotedPrice / QuotationBasis) * 10.0 * (TargetPurity / ContractPurity)",
        principles: [
          "Preserves original prices alongside all applied conversion factors.",
          "Accounts for quotation basis: GOLDM (10g -> 1.0x), GOLDTEN (10g -> 1.0x), GOLDGUINEA (8g -> 1.25x), GOLDPETAL (1g -> 10.0x).",
          "Distinguishes physical coin delivery characteristics from structural mispricings."
        ]
      },
      relative_value: {
        title: "Cross-Contract Relative Value & Statistical Spread",
        spread_formula: "Spread(t) = NormalizedPrice_A(t) - NormalizedPrice_B(t)",
        pct_spread_formula: "PctSpread(t) = (Spread(t) / ((NormalizedPrice_A(t) + NormalizedPrice_B(t)) / 2)) * 100",
        z_score_formula: "ZScore(t) = (Spread(t) - RollingMean_W(t)) / RollingStdDev_W(t)",
        lookback_window: "Configurable rolling window W (e.g. 20, 30, 60 sessions), computed strictly on historical observations."
      },
      anomaly_explainability: {
        title: "8-Point Institutional Explainability Framework",
        questions: [
          "1. What did GOLDX observe?",
          "2. How was it calculated?",
          "3. What historical reference was used?",
          "4. What assumptions were applied?",
          "5. What do liquidity and expiry tell us?",
          "6. Were transaction costs available and included?",
          "7. What are the limitations?",
          "8. What additional evidence is required?"
        ]
      },
      transaction_costs: {
        title: "Round-Trip Friction & Cost Hurdle Model",
        components: [
          { name: "Brokerage", default: "₹20 / order flat or 0.01% of turnover" },
          { name: "Exchange Transaction Charges", default: "0.0021% on turnover (MCX schedule)" },
          { name: "Commodity Transaction Tax (CTT)", default: "0.01% on non-agri commodity futures sell turnover" },
          { name: "Goods & Services Tax (GST)", default: "18% on (Brokerage + Exchange Charges)" },
          { name: "Stamp Duty", default: "0.002% on buy turnover" },
          { name: "Slippage & Bid-Ask Buffer", default: "₹10 to ₹25 / 10g depending on contract liquidity" }
        ],
        estimated_round_trip_hurdle: "₹85 - ₹105 per 10 grams equivalent"
      },
      backtesting: {
        title: "Chronological Walk-Forward Backtesting (Zero Look-Ahead Bias)",
        principles: [
          "Strict chronological evaluation across sliding train and test folds.",
          "Feature calculation and signal generation use historical observations only (t <= entry).",
          "Accounts for round-trip friction, days to expiry (DTE <= 5 cutoff), and minimum volume filters.",
          "Reports gross and net P&L, hit rate, and fold-by-fold stability matrix."
        ]
      },
      honest_disclaimer: {
        title: "Institutional Disclaimer & Compliance",
        statement: "GOLDX is an explainable quantitative analytics intelligence engine for research and educational purposes. It does not provide personalized investment advice or guaranteed market profit predictions. Market participants must assess executable liquidity, physical delivery obligations, and margin requirements independently."
      }
    }
  });
}

module.exports = {
  getPrices,
  getRelativeValue,
  getAnomalies,
  getLiquidity,
  getMethodology
};
