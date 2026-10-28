/**
 * GOLDX Frontend API Client
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    if (body.trimStart().startsWith('<')) {
      throw new Error(
        `API returned HTML instead of JSON (HTTP ${response.status}). Make sure the backend is running and the /api proxy is configured.`
      );
    }
    throw new Error(`API returned an unexpected response (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return parseApiResponse(res);
}

export async function fetchContracts() {
  const res = await fetch(`${BASE_URL}/contracts`);
  return parseApiResponse(res);
}

export async function fetchDatasets() {
  const res = await fetch(`${BASE_URL}/datasets`);
  return parseApiResponse(res);
}

export async function loadDemoDataset() {
  const res = await fetch(`${BASE_URL}/datasets/demo`, { method: 'POST' });
  return parseApiResponse(res);
}

export async function uploadDatasetFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/datasets/upload`, {
    method: 'POST',
    body: formData
  });
  return parseApiResponse(res);
}

export async function uploadDatasetText(csvText, filename = 'pasted_data.csv') {
  const res = await fetch(`${BASE_URL}/datasets/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv_text: csvText, filename })
  });
  return parseApiResponse(res);
}

export async function fetchDatasetQuality(id = 'benchmark_demo') {
  const res = await fetch(`${BASE_URL}/datasets/${id}/quality`);
  return parseApiResponse(res);
}

export function getValidationReportUrl(id = 'benchmark_demo') {
  return `${BASE_URL}/datasets/${id}/report`;
}

export async function fetchPrices(symbol = 'ALL', limit = 1000) {
  const res = await fetch(`${BASE_URL}/prices?symbol=${symbol}&limit=${limit}`);
  return parseApiResponse(res);
}

export async function fetchRelativeValue(symbolA = 'GOLDM', symbolB = 'GOLDGUINEA', lookbackWindow = 30) {
  const res = await fetch(`${BASE_URL}/relative-value?symbol_a=${symbolA}&symbol_b=${symbolB}&lookback_window=${lookbackWindow}`);
  return parseApiResponse(res);
}

export async function fetchAnomalies(symbolA = 'GOLDM', symbolB = 'GOLDGUINEA', lookbackWindow = 30, threshold = 2.0, costPer10g = 90.0, allPairs = false) {
  const res = await fetch(`${BASE_URL}/analytics/anomalies?symbol_a=${symbolA}&symbol_b=${symbolB}&lookback_window=${lookbackWindow}&threshold=${threshold}&cost_per_10g=${costPer10g}&all_pairs=${allPairs}`);
  return parseApiResponse(res);
}

export async function fetchLiquidity() {
  const res = await fetch(`${BASE_URL}/analytics/liquidity`);
  return parseApiResponse(res);
}

export async function runBacktest(params) {
  const res = await fetch(`${BASE_URL}/backtests/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return parseApiResponse(res);
}

export async function fetchBacktestById(id) {
  const res = await fetch(`${BASE_URL}/backtests/${id}`);
  return parseApiResponse(res);
}

export async function fetchMethodology() {
  const res = await fetch(`${BASE_URL}/methodology`);
  return parseApiResponse(res);
}
