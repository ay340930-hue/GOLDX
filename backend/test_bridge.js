const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function runPython(action, payload) {
  return new Promise((resolve, reject) => {
    const tmpPayload = path.join(__dirname, `tmp_${Date.now()}.json`);
    fs.writeFileSync(tmpPayload, JSON.stringify(payload));

    const pyScript = path.join(__dirname, '..', 'analytics', 'service.py');
    const child = spawn('py', ['-3.13', pyScript, '--action', action, '--payload-file', tmpPayload]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      try { fs.unlinkSync(tmpPayload); } catch (e) {}
      if (code !== 0) {
        return reject(new Error(`Python exited with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${stdout}\nError: ${err.message}`));
      }
    });
  });
}

async function main() {
  console.log("Testing Python health via Node bridge...");
  const health = await runPython('health', {});
  console.log("Python Health:", health);

  console.log("Testing backtest via Node bridge...");
  const bt = await runPython('backtest', { symbol_a: 'GOLDM', symbol_b: 'GOLDGUINEA', lookback_window: 30 });
  console.log("Backtest Status:", bt.status, "Total Trades:", bt.metrics?.total_trades, "Win Rate:", bt.metrics?.win_rate_pct + "%");
}

main().catch(console.error);
