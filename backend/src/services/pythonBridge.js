const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PYTHON_SERVICE_PORT = process.env.PYTHON_PORT || 5001;
const PYTHON_PATH = process.env.PYTHON_PATH || 'py';
const PYTHON_VERSION_ARG = process.env.PYTHON_VERSION_ARG || '-3.13';

// Path to analytics service script
const SERVICE_SCRIPT_PATH = path.resolve(__dirname, '..', '..', '..', 'analytics', 'service.py');

/**
 * Tries HTTP request to the persistent Python service.
 */
function tryHttpRequest(action, payload, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload || {});
    const req = http.request({
      hostname: '127.0.0.1',
      port: PYTHON_SERVICE_PORT,
      path: `/${action}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse Python HTTP response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => { reject(err); });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Python HTTP request timed out after ${timeoutMs}ms`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Fallback to direct Python CLI execution with temporary JSON payload.
 */
function runProcessFallback(action, payload) {
  return new Promise((resolve, reject) => {
    const tmpDir = path.resolve(__dirname, '..', '..', 'tmp');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
    }
    const tmpPayload = path.join(tmpDir, `req_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
    
    try {
      fs.writeFileSync(tmpPayload, JSON.stringify(payload || {}));
    } catch (e) {
      return reject(new Error(`Failed to write temp payload: ${e.message}`));
    }

    const args = [PYTHON_VERSION_ARG, SERVICE_SCRIPT_PATH, '--action', action, '--payload-file', tmpPayload];
    const child = spawn(PYTHON_PATH, args);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      try { if (fs.existsSync(tmpPayload)) fs.unlinkSync(tmpPayload); } catch (e) {}
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse Python stdout: ${stdout.slice(0, 500)}\nError: ${err.message}`));
      }
    });

    child.on('error', (err) => {
      try { if (fs.existsSync(tmpPayload)) fs.unlinkSync(tmpPayload); } catch (e) {}
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

/**
 * Main execute function: Tries HTTP persistent server first, falls back to direct process.
 */
async function executeAnalytics(action, payload = {}) {
  try {
    const httpRes = await tryHttpRequest(action, payload, 3000);
    return httpRes;
  } catch (httpErr) {
    // Graceful fallback to process execution
    const procRes = await runProcessFallback(action, payload);
    return procRes;
  }
}

module.exports = { executeAnalytics };
