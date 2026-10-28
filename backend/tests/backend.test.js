const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: 20000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("   GOLDX BACKEND INTEGRATION TEST SUITE   ");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name} -> ${e.message}`);
      failed++;
    }
  }

  // 1. Health
  await test("GET /api/health", async () => {
    const res = await makeRequest('/api/health');
    if (res.status !== 200 || res.body.status !== "HEALTHY") {
      throw new Error(`Expected status 200 HEALTHY, got ${res.status} ${JSON.stringify(res.body)}`);
    }
  });

  // 2. Contracts
  await test("GET /api/contracts", async () => {
    const res = await makeRequest('/api/contracts');
    if (res.status !== 200 || !res.body.contracts || res.body.contracts.length !== 4) {
      throw new Error(`Expected 4 contracts, got ${res.body.contracts?.length}`);
    }
    const symbols = res.body.contracts.map(c => c.symbol);
    if (!symbols.includes("GOLDM") || !symbols.includes("GOLDGUINEA")) {
      throw new Error(`Missing expected symbols: ${symbols}`);
    }
  });

  // 3. Datasets
  await test("GET /api/datasets", async () => {
    const res = await makeRequest('/api/datasets');
    if (res.status !== 200 || !res.body.datasets) {
      throw new Error(`Failed to list datasets`);
    }
  });

  // 4. Load Demo Dataset
  await test("POST /api/datasets/demo", async () => {
    const res = await makeRequest('/api/datasets/demo', 'POST', {});
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Demo load failed: ${JSON.stringify(res.body)}`);
    }
  });

  // 5. Data Quality
  await test("GET /api/datasets/benchmark_demo/quality", async () => {
    const res = await makeRequest('/api/datasets/benchmark_demo/quality');
    if (res.status !== 200 || res.body.health_score !== 100) {
      throw new Error(`Expected health score 100, got ${res.body.health_score}`);
    }
  });

  // 6. Normalized Prices
  await test("GET /api/prices", async () => {
    const res = await makeRequest('/api/prices?symbol=GOLDM&limit=10');
    if (res.status !== 200 || !res.body.records || res.body.records.length === 0) {
      throw new Error(`Failed to get prices`);
    }
    const sample = res.body.records[0];
    if (!sample.NormalizedPrice || !sample.Formula) {
      throw new Error(`Normalized price or formula missing in record`);
    }
  });

  // 7. Relative-Value
  await test("GET /api/relative-value?symbol_a=GOLDM&symbol_b=GOLDGUINEA", async () => {
    const res = await makeRequest('/api/relative-value?symbol_a=GOLDM&symbol_b=GOLDGUINEA&lookback_window=30');
    if (res.status !== 200 || !res.body.data || res.body.data.length === 0) {
      throw new Error(`Failed relative value computation`);
    }
    const sample = res.body.data[res.body.data.length - 1];
    if (sample.Spread === undefined || sample.ZScore === undefined) {
      throw new Error(`Spread or ZScore missing from output`);
    }
  });

  await test("GET /api/relative-value rejects identical contracts", async () => {
    const res = await makeRequest('/api/relative-value?symbol_a=GOLDTEN&symbol_b=GOLDTEN');
    if (res.status !== 400 || !res.body.error) {
      throw new Error(`Expected a 400 error for identical contracts, got ${res.status} ${JSON.stringify(res.body)}`);
    }
  });

  // 8. Anomalies
  await test("GET /api/analytics/anomalies (8-Point Explainability)", async () => {
    const res = await makeRequest('/api/analytics/anomalies?symbol_a=GOLDM&symbol_b=GOLDGUINEA&threshold=2.0');
    if (res.status !== 200 || !res.body.anomalies) {
      throw new Error(`Failed to get anomalies`);
    }
    if (res.body.anomalies.length > 0) {
      const anom = res.body.anomalies[0];
      if (!anom.q1_observation || !anom.q2_calculation || !anom.q3_historical_reference ||
          !anom.q4_assumptions || !anom.q5_liquidity_expiry || !anom.q6_costs ||
          !anom.q7_limitations || !anom.q8_additional_evidence) {
        throw new Error(`8-point explainability framework incomplete in anomaly object`);
      }
    }
  });

  // 9. Liquidity & Expiry
  await test("GET /api/analytics/liquidity", async () => {
    const res = await makeRequest('/api/analytics/liquidity');
    if (res.status !== 200 || !res.body.contracts || res.body.contracts.length === 0) {
      throw new Error(`Liquidity data missing`);
    }
  });

  // 10. Walk-Forward Backtesting
  await test("POST /api/backtests/run (Zero Look-Ahead Bias)", async () => {
    const res = await makeRequest('/api/backtests/run', 'POST', {
      symbol_a: 'GOLDM',
      symbol_b: 'GOLDGUINEA',
      lookback_window: 30,
      entry_threshold: 2.0,
      exit_threshold: 0.5,
      round_trip_cost: 90.0,
      fold_train_size: 60,
      fold_test_size: 20
    });
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Backtest failed: ${JSON.stringify(res.body)}`);
    }
    if (!res.body.trades || !res.body.folds || !res.body.equity_curve) {
      throw new Error(`Backtest missing trades, folds or equity curve`);
    }
    console.log(`   -> Total Simulated Trades: ${res.body.metrics.total_trades}, Win Rate: ${res.body.metrics.win_rate_pct}%, Net P&L: ₹${res.body.metrics.total_net_pnl}`);
  });

  // 11. Methodology
  await test("GET /api/methodology", async () => {
    const res = await makeRequest('/api/methodology');
    if (res.status !== 200 || !res.body.methodology?.honest_disclaimer) {
      throw new Error(`Methodology documentation missing`);
    }
  });

  console.log(`\n==========================================`);
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log(`==========================================`);

  if (failed > 0) process.exit(1);
}

runTests();
