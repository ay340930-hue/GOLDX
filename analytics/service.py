"""
GOLDX - Python Analytics Service Bridge
Provides both a persistent HTTP server on port 5001 and a CLI interface for the Node.js backend.
Uses standard library http.server for 100% zero-dependency persistent serving.
"""

import os
import sys
curr_dir = os.path.dirname(os.path.abspath(__file__))
if curr_dir not in sys.path:
    sys.path.insert(0, curr_dir)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import json
import argparse
import pandas as pd
from http.server import HTTPServer, BaseHTTPRequestHandler
from specs import CONTRACT_SPECS, DEFAULT_ANALYTICAL_BASIS
from engine import (
    validate_dataset,
    normalize_dataset,
    calculate_relative_value,
    detect_anomalies,
    run_walk_forward_backtest
)

import math

def sanitize_nan(obj):
    """Recursively converts NaN and Inf float values to None (JSON null)."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nan(v) for v in obj]
    return obj

# In-memory cache for active dataset DataFrame
ACTIVE_CACHE = {
    "dataset_id": None,
    "raw_df": None,
    "normalized_df": None,
    "validation_result": None
}

def load_dataset_into_cache(csv_path_or_data, dataset_id="active"):
    try:
        if isinstance(csv_path_or_data, str) and os.path.exists(csv_path_or_data):
            df = pd.read_csv(csv_path_or_data)
        elif isinstance(csv_path_or_data, list):
            df = pd.DataFrame(csv_path_or_data)
        else:
            from io import StringIO
            df = pd.read_csv(StringIO(csv_path_or_data))
            
        val_res = validate_dataset(df)
        if val_res["is_valid"]:
            clean_df = val_res.pop("cleaned_df")
            norm_df = normalize_dataset(clean_df)
            ACTIVE_CACHE["dataset_id"] = dataset_id
            ACTIVE_CACHE["raw_df"] = clean_df
            ACTIVE_CACHE["normalized_df"] = norm_df
            ACTIVE_CACHE["validation_result"] = val_res
            return {
                "success": True,
                "dataset_id": dataset_id,
                "validation": val_res,
                "total_records": len(norm_df),
                "symbols": list(norm_df['Symbol'].unique())
            }
        else:
            return {
                "success": False,
                "validation": val_res
            }
    except Exception as e:
        return {"success": False, "error": str(e)}

def dispatch_action(action, payload):
    try:
        if action == "health":
            return {
                "status": "UP",
                "python_version": sys.version,
                "specs_version": "2024.1",
                "supported_contracts": list(CONTRACT_SPECS.keys()),
                "cached_dataset": ACTIVE_CACHE["dataset_id"],
                "cached_records": len(ACTIVE_CACHE["normalized_df"]) if ACTIVE_CACHE["normalized_df"] is not None else 0
            }
            
        elif action == "specs":
            return {
                "specs": CONTRACT_SPECS,
                "default_basis": DEFAULT_ANALYTICAL_BASIS
            }
            
        elif action == "load_data":
            csv_path = payload.get("csv_path")
            csv_text = payload.get("csv_text")
            records = payload.get("records")
            dataset_id = payload.get("dataset_id", "demo")
            
            source = csv_path if csv_path else (records if records else csv_text)
            return load_dataset_into_cache(source, dataset_id=dataset_id)
            
        elif action == "validate":
            csv_path = payload.get("csv_path")
            if csv_path and os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
            else:
                from io import StringIO
                df = pd.read_csv(StringIO(payload.get("csv_text", "")))
            res = validate_dataset(df)
            # Remove DataFrame before JSON serialization
            res.pop("cleaned_df", None)
            return res
            
        elif action == "prices":
            # Return normalized prices table
            if ACTIVE_CACHE["normalized_df"] is None:
                # Load default benchmark if empty
                demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
                load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
                
            df_norm = ACTIVE_CACHE["normalized_df"]
            symbol = payload.get("symbol")
            if symbol and symbol != "ALL":
                df_norm = df_norm[df_norm['Symbol'] == symbol]
                
            limit = payload.get("limit", 1000)
            records = df_norm.tail(limit).to_dict(orient="records")
            return {
                "total": len(records),
                "basis": DEFAULT_ANALYTICAL_BASIS,
                "records": records
            }
            
        elif action == "relative_value":
            if ACTIVE_CACHE["normalized_df"] is None:
                demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
                load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
                
            sym_a = payload.get("symbol_a", "GOLDM")
            sym_b = payload.get("symbol_b", "GOLDTEN")
            lookback = int(payload.get("lookback_window", 30))
            
            rv_res = calculate_relative_value(ACTIVE_CACHE["normalized_df"], sym_a, sym_b, lookback_window=lookback)
            return rv_res
            
        elif action == "anomalies":
            if ACTIVE_CACHE["normalized_df"] is None:
                demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
                load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
                
            sym_a = payload.get("symbol_a", "GOLDM")
            sym_b = payload.get("symbol_b", "GOLDGUINEA")
            lookback = int(payload.get("lookback_window", 30))
            threshold = float(payload.get("threshold", 2.0))
            cost = float(payload.get("cost_per_10g", 90.0))
            
            # Check single pair or all pairs
            all_pairs = payload.get("all_pairs", False)
            if all_pairs:
                pairs = [
                    ("GOLDM", "GOLDTEN"),
                    ("GOLDM", "GOLDGUINEA"),
                    ("GOLDM", "GOLDPETAL"),
                    ("GOLDTEN", "GOLDGUINEA"),
                    ("GOLDGUINEA", "GOLDPETAL")
                ]
                all_anomalies = []
                for p_a, p_b in pairs:
                    rv = calculate_relative_value(ACTIVE_CACHE["normalized_df"], p_a, p_b, lookback_window=lookback)
                    if "error" not in rv:
                        anoms = detect_anomalies(rv, z_threshold=threshold, cost_per_10g=cost)
                        all_anomalies.extend(anoms)
                # Sort descending by date and absolute Z-score
                all_anomalies.sort(key=lambda x: (x["date"], abs(x["z_score"])), reverse=True)
                return {
                    "total_anomalies": len(all_anomalies),
                    "threshold": threshold,
                    "cost_per_10g": cost,
                    "anomalies": all_anomalies
                }
            else:
                rv = calculate_relative_value(ACTIVE_CACHE["normalized_df"], sym_a, sym_b, lookback_window=lookback)
                anoms = detect_anomalies(rv, z_threshold=threshold, cost_per_10g=cost)
                return {
                    "symbol_a": sym_a,
                    "symbol_b": sym_b,
                    "total_anomalies": len(anoms),
                    "threshold": threshold,
                    "cost_per_10g": cost,
                    "anomalies": anoms
                }
                
        elif action == "liquidity":
            if ACTIVE_CACHE["normalized_df"] is None:
                demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
                load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
                
            df = ACTIVE_CACHE["normalized_df"]
            # Latest observation per symbol
            latest_date = df['Date'].max()
            latest_rows = df[df['Date'] == latest_date]
            
            contracts_liquidity = []
            for _, r in latest_rows.iterrows():
                sym = r['Symbol']
                vol = int(r.get('Volume', 0))
                oi = int(r.get('OpenInterest', 0))
                dte = None
                exp = r.get('ExpiryDate')
                if exp and not pd.isna(exp):
                    try:
                        d_c = datetime.strptime(str(r['Date'])[:10], "%Y-%m-%d")
                        d_e = datetime.strptime(str(exp)[:10], "%Y-%m-%d")
                        dte = (d_e - d_c).days
                    except Exception:
                        pass
                        
                vol_oi_ratio = round(vol / max(oi, 1), 3)
                
                warnings = []
                if vol < 100:
                    warnings.append("Low Trading Volume (< 100 lots) — executable slippage hazard")
                if dte is not None and dte <= 5:
                    warnings.append(f"Near-Expiry Tender Alert ({dte} DTE) — delivery margin penalty risk")
                if vol_oi_ratio < 0.05:
                    warnings.append("Low Turnover/OI Ratio (< 0.05) — trapped inventory risk")
                    
                contracts_liquidity.append({
                    "symbol": sym,
                    "name": CONTRACT_SPECS[sym]["name"],
                    "date": latest_date,
                    "expiry_date": exp,
                    "dte": dte,
                    "volume": vol,
                    "open_interest": oi,
                    "vol_oi_ratio": vol_oi_ratio,
                    "raw_price": r['RawPrice'],
                    "normalized_price": r['NormalizedPrice'],
                    "status": "NORMAL" if not warnings else "CAUTION",
                    "warnings": warnings
                })
                
            return {
                "latest_date": latest_date,
                "contracts": contracts_liquidity
            }
            
        elif action == "backtest":
            if ACTIVE_CACHE["normalized_df"] is None:
                demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
                load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
                
            sym_a = payload.get("symbol_a", "GOLDM")
            sym_b = payload.get("symbol_b", "GOLDTEN")
            lookback = int(payload.get("lookback_window", 30))
            
            rv_res = calculate_relative_value(ACTIVE_CACHE["normalized_df"], sym_a, sym_b, lookback_window=lookback)
            if "error" in rv_res:
                return rv_res
                
            config = payload.get("config", {})
            return run_walk_forward_backtest(rv_res, config=config)
            
        else:
            return {"error": f"Unknown action '{action}'"}
            
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

class AnalyticsRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health" or self.path == "/api/health":
            res = dispatch_action("health", {})
            self._send_json(200, res)
        elif self.path == "/specs" or self.path == "/api/specs":
            res = dispatch_action("specs", {})
            self._send_json(200, res)
        elif self.path.startswith("/prices"):
            res = dispatch_action("prices", {})
            self._send_json(200, res)
        elif self.path.startswith("/liquidity"):
            res = dispatch_action("liquidity", {})
            self._send_json(200, res)
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8')
        payload = json.loads(body) if body else {}
        
        path = self.path.strip('/')
        if path.startswith("api/"):
            path = path[4:]
            
        res = dispatch_action(path, payload)
        self._send_json(200, res)

    def _send_json(self, code, data):
        self.send_response(code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        clean_data = sanitize_nan(data)
        self.wfile.write(json.dumps(clean_data, default=str).encode('utf-8'))

    def log_message(self, format, *args):
        # Keep logs clean
        pass

def start_server(port=5001):
    # Preload benchmark dataset
    demo_path = os.path.join(os.path.dirname(__file__), "..", "demo-data", "mcx_gold_benchmark_demo.csv")
    if os.path.exists(demo_path):
        load_dataset_into_cache(demo_path, dataset_id="benchmark_demo")
        print(f"Preloaded benchmark dataset from {demo_path}")
        
    server = HTTPServer(('127.0.0.1', port), AnalyticsRequestHandler)
    print(f"GOLDX Python Analytics Engine running on http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GOLDX Analytics Service")
    parser.add_argument("--server", action="store_true", help="Start persistent HTTP server")
    parser.add_argument("--port", type=int, default=5001, help="Server port (default 5001)")
    parser.add_argument("--action", type=str, help="Action to execute via CLI")
    parser.add_argument("--payload", type=str, default="{}", help="JSON payload string")
    parser.add_argument("--payload-file", type=str, help="Path to JSON payload file")
    
    args = parser.parse_args()
    
    if args.server:
        start_server(args.port)
    elif args.action:
        payload = {}
        if args.payload_file and os.path.exists(args.payload_file):
            with open(args.payload_file, "r", encoding="utf-8") as f:
                payload = json.load(f)
        elif args.payload:
            payload = json.loads(args.payload)
            
        result = dispatch_action(args.action, payload)
        clean_res = sanitize_nan(result)
        print(json.dumps(clean_res, default=str))
    else:
        # Default behavior if executed directly: start server
        start_server(args.port)
