const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWin = process.platform === 'win32';
const PYTHON_SERVICE_PORT = process.env.PYTHON_PORT || 5001;
const PYTHON_PATH = process.env.PYTHON_PATH || (isWin ? 'py' : 'python3');

// Only the Windows Python Launcher ('py' / 'py.exe') supports version flags like '-3.13' or '-3'.
// Standard python/python3 binaries will crash with: "Unknown option: -3"
const pyExecutableName = path.basename(PYTHON_PATH).toLowerCase().replace(/\.exe$/, '');
const isPyLauncher = pyExecutableName === 'py';

let rawVersionArg = process.env.PYTHON_VERSION_ARG !== undefined 
  ? process.env.PYTHON_VERSION_ARG.trim() 
  : (isWin && isPyLauncher ? '-3.13' : '');

// Only valid command-line flags starting with '-' are allowed (reject URIs, database strings, or invalid inputs)
if (!rawVersionArg.startsWith('-') || rawVersionArg.includes('://')) {
  rawVersionArg = '';
}

// If not using 'py' launcher, filter out version selector flags (e.g. -3, -3.13, -2)
if (!isPyLauncher && /^-\d/.test(rawVersionArg)) {
  rawVersionArg = '';
}

const PYTHON_VERSION_ARG = rawVersionArg;

function getPythonArgs(extraArgs = []) {
  const args = [];
  if (PYTHON_VERSION_ARG && PYTHON_VERSION_ARG.length > 0) {
    args.push(PYTHON_VERSION_ARG);
  }
  return args.concat(extraArgs);
}

// Path to analytics service script
const SERVICE_SCRIPT_PATH = path.resolve(__dirname, '..', '..', '..', 'analytics', 'service.py');
let pythonServiceProcess = null;
let pythonServiceStartup = null;

process.once('exit', () => {
  if (pythonServiceProcess && pythonServiceProcess.exitCode === null) {
    pythonServiceProcess.kill();
  }
});

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

    const args = getPythonArgs([SERVICE_SCRIPT_PATH, '--action', action, '--payload-file', tmpPayload]);
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
 * Starts the persistent analytics service and waits until it can handle requests.
 */
function startPythonService() {
  if (pythonServiceStartup) return pythonServiceStartup;
  if (pythonServiceProcess && pythonServiceProcess.exitCode === null) {
    return waitForPythonService(pythonServiceProcess);
  }

  const args = getPythonArgs([
    SERVICE_SCRIPT_PATH,
    '--server',
    '--port',
    String(PYTHON_SERVICE_PORT)
  ]);
  const child = spawn(PYTHON_PATH, args, { stdio: ['ignore', 'ignore', 'inherit'] });
  pythonServiceProcess = child;
  child.unref();

  let startupError = null;
  child.on('error', (error) => {
    startupError = error;
    if (pythonServiceProcess === child) pythonServiceProcess = null;
  });
  child.on('exit', () => {
    if (pythonServiceProcess === child) pythonServiceProcess = null;
  });

  const startup = waitForPythonService(child, () => startupError);
  const trackedStartup = startup.finally(() => {
    if (pythonServiceStartup === trackedStartup) pythonServiceStartup = null;
  });
  pythonServiceStartup = trackedStartup;
  return trackedStartup;
}

async function waitForPythonService(child, getStartupError = () => null) {
  const deadline = Date.now() + 60000;

  while (Date.now() < deadline) {
    try {
      const health = await tryHttpRequest('health', {}, 1000);
      if (health.status === 'UP') return;
    } catch {
      // The service may still be importing its analytics dependencies.
    }

    const startupError = getStartupError();
    if (startupError) {
      throw new Error(`Failed to start Python analytics service: ${startupError.message}`);
    }
    if (child.exitCode !== null) {
      throw new Error(`Python analytics service exited with code ${child.exitCode}.`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  child.kill();
  throw new Error('Timed out waiting for Python analytics service to start.');
}

/**
 * Main execute function: Tries HTTP persistent server first, falls back to direct process.
 */
async function executeAnalytics(action, payload = {}) {
  try {
    const httpRes = await tryHttpRequest(action, payload, 30000);
    return httpRes;
  } catch (httpErr) {
    try {
      await startPythonService();
      return await tryHttpRequest(action, payload, 30000);
    } catch (serviceErr) {
      console.warn(`[GOLDX Analytics] Persistent service unavailable; using process fallback: ${serviceErr.message}`);
    }

    const procRes = await runProcessFallback(action, payload);
    return procRes;
  }
}

module.exports = { executeAnalytics, getPythonArgs };
