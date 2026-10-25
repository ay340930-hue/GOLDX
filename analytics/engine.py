"""
GOLDX - Quantitative Commodity Derivatives Analytics Engine
Implements:
1. Data Ingestion & Row-Level Validation
2. Unit & Purity Normalization Engine (MCX Specifications)
3. Cross-Contract Relative-Value & Statistical Spread Engine
4. Explainable 8-Point Historical Anomaly Detector
5. Risk, Liquidity, Expiry & Transaction-Cost Layer
6. Chronological Walk-Forward Backtester (Zero Look-Ahead Bias)
"""

import os
import sys
curr_dir = os.path.dirname(os.path.abspath(__file__))
if curr_dir not in sys.path:
    sys.path.insert(0, curr_dir)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import json
import math
import numpy as np
import pandas as pd
from datetime import datetime
from specs import CONTRACT_SPECS, DEFAULT_ANALYTICAL_BASIS, normalize_price

def validate_dataset(df):
    """
    Validates ingested dataset against MCX contract rules and data quality standards.
    Returns: {
        is_valid: bool,
        health_score: float (0-100),
        total_rows: int,
        valid_rows: int,
        rejected_rows: int,
        summary: dict,
        errors: list of { row, column, message, value },
        contract_counts: dict
    }
    """
    errors = []
    
    # Standardize column names without generating duplicate column targets
    target_priority = {
        'Date': ['DATE', 'TIMESTAMP', 'TRADEDATE', 'TRADE_DATE'],
        'Symbol': ['SYMBOL', 'CONTRACT', 'INSTRUMENT'],
        'ExpiryDate': ['EXPIRYDATE', 'EXPIRY_DATE', 'EXPIRY_DT', 'EXPIRY'],
        'Close': ['CLOSE', 'SETTLEPRICE', 'SETTLE_PR', 'PRICE', 'LTP'],
        'Volume': ['VOLUME', 'VOL', 'TRADED_QTY', 'TRADEDQTY'],
        'OpenInterest': ['OPENINTEREST', 'OPEN_INT', 'OI'],
        'Open': ['OPEN', 'OPEN_PRICE'],
        'High': ['HIGH', 'HIGH_PRICE'],
        'Low': ['LOW', 'LOW_PRICE'],
        'Purity': ['PURITY', 'FINENESS'],
        'QuotationBasis': ['QUOTATIONBASIS', 'QUOTATION_BASIS']
    }
    
    col_map = {}
    assigned_targets = set()
    
    # First preserve exact matches
    for col in df.columns:
        if col in target_priority:
            assigned_targets.add(col)
            
    # Then map remaining columns
    for col in df.columns:
        if col in assigned_targets:
            continue
        c_upper = col.strip().upper()
        for target, aliases in target_priority.items():
            if target not in assigned_targets and c_upper in aliases:
                col_map[col] = target
                assigned_targets.add(target)
                break
                
    df_clean = df.rename(columns=col_map).copy()
    # Deduplicate columns if any duplicate headers exist
    df_clean = df_clean.loc[:, ~df_clean.columns.duplicated()].copy()
    
    required_cols = ['Date', 'Symbol', 'Close']
    missing_required = [c for c in required_cols if c not in df_clean.columns]
    if missing_required:
        return {
            "is_valid": False,
            "health_score": 0.0,
            "total_rows": len(df),
            "valid_rows": 0,
            "rejected_rows": len(df),
            "summary": {"critical_error": f"Missing required columns: {missing_required}"},
            "errors": [{"row": 0, "column": "HEADER", "message": f"Missing columns: {missing_required}", "value": None}],
            "contract_counts": {}
        }
        
    valid_mask = pd.Series(True, index=df_clean.index)
    
    # 1. Date validation
    for idx, val in df_clean['Date'].items():
        if pd.isna(val) or str(val).strip() == '':
            errors.append({"row": int(idx) + 2, "column": "Date", "message": "Missing date value", "value": str(val)})
            valid_mask.loc[idx] = False
        else:
            try:
                pd.to_datetime(val)
            except Exception:
                errors.append({"row": int(idx) + 2, "column": "Date", "message": "Invalid date format", "value": str(val)})
                valid_mask.loc[idx] = False
                
    # 2. Symbol validation (Must be in CONTRACT_SPECS)
    supported_symbols = set(CONTRACT_SPECS.keys())
    for idx, val in df_clean['Symbol'].items():
        sym = str(val).strip().upper() if not pd.isna(val) else ""
        if sym not in supported_symbols:
            errors.append({
                "row": int(idx) + 2,
                "column": "Symbol",
                "message": f"Unsupported contract symbol '{sym}'. Supported: {list(supported_symbols)}",
                "value": str(val)
            })
            valid_mask.loc[idx] = False
        else:
            df_clean.loc[idx, 'Symbol'] = sym

    # 3. Numeric price validation
    for idx, val in df_clean['Close'].items():
        try:
            p = float(val)
            if pd.isna(p) or p <= 0:
                errors.append({"row": int(idx) + 2, "column": "Close", "message": "Price must be greater than zero", "value": str(val)})
                valid_mask.loc[idx] = False
            elif p > 250000:  # Beyond reasonable Indian gold contract price bounds
                errors.append({"row": int(idx) + 2, "column": "Close", "message": "Price exceeds plausible MCX bounds (> ₹2,50,000)", "value": str(val)})
                valid_mask.loc[idx] = False
        except (ValueError, TypeError):
            errors.append({"row": int(idx) + 2, "column": "Close", "message": "Price is not a valid number", "value": str(val)})
            valid_mask.loc[idx] = False

    # 4. Duplicate checks (Date + Symbol + ExpiryDate)
    check_cols = ['Date', 'Symbol']
    if 'ExpiryDate' in df_clean.columns:
        check_cols.append('ExpiryDate')
    dups = df_clean.duplicated(subset=check_cols, keep='first')
    for idx in df_clean[dups].index:
        errors.append({
            "row": int(idx) + 2,
            "column": "DUPLICATE",
            "message": f"Duplicate observation for {check_cols}",
            "value": str(df_clean.loc[idx, 'Symbol'])
        })
        valid_mask.loc[idx] = False

    # 5. Stale price check (flag if price is identical for 4+ consecutive sessions)
    for sym in supported_symbols:
        sym_df = df_clean[df_clean['Symbol'] == sym].sort_values('Date')
        if len(sym_df) > 4:
            consec = (sym_df['Close'] == sym_df['Close'].shift(1)).astype(int)
            rolling_same = consec.rolling(4).sum()
            stale_indices = sym_df[rolling_same >= 3].index
            for s_idx in stale_indices:
                errors.append({
                    "row": int(s_idx) + 2,
                    "column": "STALE_QUOTE",
                    "message": f"Stale quote warning: {sym} close price unchanged for 4+ consecutive sessions",
                    "value": str(sym_df.loc[s_idx, 'Close'])
                })

    total_rows = len(df_clean)
    valid_rows = int(valid_mask.sum())
    rejected_rows = total_rows - valid_rows
    
    # Health score: Deduct for rejected rows and critical issues
    health_score = max(0.0, round((valid_rows / max(total_rows, 1)) * 100.0 - (len(errors) * 0.1), 1))
    
    # Contract counts
    contract_counts = df_clean[valid_mask]['Symbol'].value_counts().to_dict()
    
    return {
        "is_valid": valid_rows > 0,
        "health_score": health_score,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "rejected_rows": rejected_rows,
        "contract_counts": contract_counts,
        "summary": {
            "total_errors": len(errors),
            "duplicate_count": int(dups.sum()),
            "date_range": {
                "start": str(df_clean['Date'].min()),
                "end": str(df_clean['Date'].max())
            } if total_rows > 0 else {}
        },
        "errors": errors[:250],  # Return up to 250 row-level errors
        "cleaned_df": df_clean[valid_mask].copy()
    }

def normalize_dataset(df, target_unit_grams=10.0, target_purity=999):
    """
    Converts raw contract prices to common analytical unit: ₹ per 10g (999 fineness).
    Preserves all original parameters, conversion factors and formulas.
    """
    results = []
    for idx, row in df.iterrows():
        sym = row['Symbol']
        raw_p = float(row['Close'])
        purity = int(row.get('Purity', 999)) if not pd.isna(row.get('Purity')) else 999
        
        norm_info = normalize_price(sym, raw_p, purity=purity, 
                                   target_unit_grams=target_unit_grams, 
                                   target_purity=target_purity)
        
        results.append({
            "Date": str(row['Date'])[:10],
            "Symbol": sym,
            "ExpiryDate": str(row.get('ExpiryDate', ''))[:10] if not pd.isna(row.get('ExpiryDate')) else None,
            "RawPrice": raw_p,
            "QuotationBasis": CONTRACT_SPECS[sym]["quotation_label"],
            "TradingUnit": CONTRACT_SPECS[sym]["trading_unit_label"],
            "ContractPurity": purity,
            "TargetPurity": target_purity,
            "UnitFactor": norm_info["unit_factor"],
            "PurityFactor": norm_info["purity_factor"],
            "TotalMultiplier": norm_info["total_multiplier"],
            "NormalizedPrice": norm_info["normalized_price"],
            "Formula": norm_info["formula"],
            "Volume": int(row.get('Volume', 0)) if not pd.isna(row.get('Volume')) else 0,
            "OpenInterest": int(row.get('OpenInterest', 0)) if not pd.isna(row.get('OpenInterest')) else 0,
            "SpecVersion": norm_info["spec_version"],
            "Warnings": norm_info["warnings"]
        })
        
    return pd.DataFrame(results)

def calculate_relative_value(df_norm, symbol_a="GOLDM", symbol_b="GOLDTEN", lookback_window=30):
    """
    Calculates cross-contract relative-value spreads, rolling statistics and Z-scores.
    Strictly uses historical observations up to time t (Zero Look-Ahead Bias).
    """
    df_a = df_norm[df_norm['Symbol'] == symbol_a][['Date', 'NormalizedPrice', 'RawPrice', 'Volume', 'OpenInterest', 'ExpiryDate']].copy()
    df_b = df_norm[df_norm['Symbol'] == symbol_b][['Date', 'NormalizedPrice', 'RawPrice', 'Volume', 'OpenInterest', 'ExpiryDate']].copy()
    
    df_a = df_a.rename(columns={
        'NormalizedPrice': 'PriceA_Norm', 'RawPrice': 'PriceA_Raw',
        'Volume': 'VolumeA', 'OpenInterest': 'OIA', 'ExpiryDate': 'ExpiryA'
    })
    df_b = df_b.rename(columns={
        'NormalizedPrice': 'PriceB_Norm', 'RawPrice': 'PriceB_Raw',
        'Volume': 'VolumeB', 'OpenInterest': 'OIB', 'ExpiryDate': 'ExpiryB'
    })
    
    # Merge on Date (inner join ensures strict date alignment)
    merged = pd.merge(df_a, df_b, on='Date').sort_values('Date').reset_index(drop=True)
    
    if len(merged) < 5:
        return {
            "error": f"Insufficient matching dates ({len(merged)}) between {symbol_a} and {symbol_b}. Minimum 5 required."
        }
        
    # Spread(t) = PriceA_Norm(t) - PriceB_Norm(t)
    merged['Spread'] = merged['PriceA_Norm'] - merged['PriceB_Norm']
    
    # Percentage Spread: Spread / MidPrice * 100
    mid_price = (merged['PriceA_Norm'] + merged['PriceB_Norm']) / 2.0
    merged['PctSpread'] = (merged['Spread'] / mid_price) * 100.0
    
    # Historical rolling statistics strictly with lookback window W
    # min_periods = max(5, W // 2)
    min_p = max(5, lookback_window // 2)
    merged['RollingMean'] = merged['Spread'].rolling(window=lookback_window, min_periods=min_p).mean()
    merged['RollingStd'] = merged['Spread'].rolling(window=lookback_window, min_periods=min_p).std()
    
    # Replace zero std with tiny epsilon to prevent division by zero
    std_safe = merged['RollingStd'].replace(0, np.nan)
    merged['ZScore'] = (merged['Spread'] - merged['RollingMean']) / std_safe
    
    # Historical Percentile Rank (within rolling window)
    def calc_percentile(window_series):
        if len(window_series) < min_p:
            return np.nan
        curr_val = window_series.iloc[-1]
        return (window_series <= curr_val).mean() * 100.0
        
    merged['Percentile'] = merged['Spread'].rolling(window=lookback_window, min_periods=min_p).apply(calc_percentile, raw=False)
    
    # Clean NaNs and infinite values
    merged['RollingMean'] = merged['RollingMean'].round(2)
    merged['RollingStd'] = merged['RollingStd'].round(2)
    merged['ZScore'] = merged['ZScore'].round(2)
    merged['Percentile'] = merged['Percentile'].round(1)
    merged['Spread'] = merged['Spread'].round(2)
    merged['PctSpread'] = merged['PctSpread'].round(3)
    
    # Days to Expiry (DTE) for each leg
    def get_dte(row, exp_col):
        exp = row.get(exp_col)
        if not exp or pd.isna(exp):
            return None
        try:
            d_curr = datetime.strptime(str(row['Date'])[:10], "%Y-%m-%d")
            d_exp = datetime.strptime(str(exp)[:10], "%Y-%m-%d")
            return (d_exp - d_curr).days
        except Exception:
            return None
            
    merged['DTE_A'] = merged.apply(lambda r: get_dte(r, 'ExpiryA'), axis=1)
    merged['DTE_B'] = merged.apply(lambda r: get_dte(r, 'ExpiryB'), axis=1)
    
    clean_records = merged.where(pd.notnull(merged), None).to_dict(orient='records')
    
    return {
        "symbol_a": symbol_a,
        "symbol_b": symbol_b,
        "lookback_window": lookback_window,
        "total_observations": len(merged),
        "spec_a": CONTRACT_SPECS[symbol_a],
        "spec_b": CONTRACT_SPECS[symbol_b],
        "data": clean_records
    }

def detect_anomalies(rv_result, z_threshold=2.0, cost_per_10g=90.0):
    """
    Identifies statistically significant spread dislocations (|Z-Score| >= z_threshold).
    Produces the institutional 8-Point Explainability Framework for every flagged event.
    """
    if "error" in rv_result:
        return []
        
    symbol_a = rv_result["symbol_a"]
    symbol_b = rv_result["symbol_b"]
    spec_a = rv_result["spec_a"]
    spec_b = rv_result["spec_b"]
    data = rv_result["data"]
    
    anomalies = []
    
    for row in data:
        z = row.get('ZScore')
        if z is None or pd.isna(z):
            continue
            
        if abs(z) >= z_threshold:
            date = row['Date']
            spread = row['Spread']
            pct_spread = row['PctSpread']
            mean = row['RollingMean']
            std = row['RollingStd']
            price_a = row['PriceA_Norm']
            price_b = row['PriceB_Norm']
            raw_a = row['PriceA_Raw']
            raw_b = row['PriceB_Raw']
            vol_a = row.get('VolumeA', 0)
            vol_b = row.get('VolumeB', 0)
            oi_a = row.get('OIA', 0)
            oi_b = row.get('OIB', 0)
            dte_a = row.get('DTE_A')
            dte_b = row.get('DTE_B')
            
            # Cost impact
            gross_spread = abs(spread)
            net_spread = round(gross_spread - cost_per_10g, 2)
            cost_status = "SURVIVES_COSTS" if net_spread > 0 else "ABSORBED_BY_COSTS"
            
            # Severity classification
            if abs(z) >= 3.0:
                severity = "CRITICAL_DEVIATION"
            elif abs(z) >= 2.5:
                severity = "HIGH_DEVIATION"
            else:
                severity = "MODERATE_DEVIATION"
                
            direction = f"{symbol_a} PREMIUM" if spread > 0 else f"{symbol_b} PREMIUM"
            
            # 8-POINT INSTITUTIONAL EXPLAINABILITY FRAMEWORK:
            explanation = {
                "id": f"{symbol_a}_{symbol_b}_{date}_{abs(z):.2f}",
                "date": date,
                "symbol_a": symbol_a,
                "symbol_b": symbol_b,
                "spread": spread,
                "pct_spread": pct_spread,
                "z_score": z,
                "severity": severity,
                "direction": direction,
                "threshold_applied": z_threshold,
                
                # Question 1: What did GOLDX observe?
                "q1_observation": (
                    f"A relative spread of ₹{spread:+.2f}/10g ({pct_spread:+.2f}%) was detected between "
                    f"{symbol_a} (₹{price_a:,.2f}) and {symbol_b} (₹{price_b:,.2f}). "
                    f"The statistical Z-score reached {z:+.2f}, breaching the configured ±{z_threshold} threshold."
                ),
                
                # Question 2: How was it calculated?
                "q2_calculation": (
                    f"Calculated on standard common basis ₹/10g (999 fineness). "
                    f"{symbol_a} raw price ₹{raw_a:,.2f} × {spec_a['multiplier_to_10g']}x = ₹{price_a:,.2f}. "
                    f"{symbol_b} raw price ₹{raw_b:,.2f} × {spec_b['multiplier_to_10g']}x = ₹{price_b:,.2f}. "
                    f"Spread = {price_a:,.2f} - {price_b:,.2f} = ₹{spread:+.2f}. "
                    f"Z-Score = ({spread:+.2f} - {mean}) / {std} = {z:+.2f}."
                ),
                
                # Question 3: What historical reference was used?
                "q3_historical_reference": (
                    f"Rolling lookback window of {rv_result['lookback_window']} trading sessions prior to {date}. "
                    f"Historical Mean Spread μ = ₹{mean:.2f}/10g, Historical Standard Deviation σ = ₹{std:.2f}/10g. "
                    f"Spread percentile rank: {row.get('Percentile', 'N/A')}%."
                ),
                
                # Question 4: What assumptions were applied?
                "q4_assumptions": (
                    f"Assumed 999 fineness parity and standardized MCX quotation specifications. "
                    f"Assumed delivery units ({spec_a.get('delivery_unit_label', spec_a.get('trading_unit_label', 'Standard'))} vs {spec_b.get('delivery_unit_label', spec_b.get('trading_unit_label', 'Standard'))}) "
                    f"do not carry permanent structural liquidity premiums outside physical tender periods."
                ),
                
                # Question 5: What do liquidity and expiry tell us?
                "q5_liquidity_expiry": (
                    f"Volume: {symbol_a} = {vol_a:,} lots vs {symbol_b} = {vol_b:,} lots (OI: {oi_a:,} vs {oi_b:,}). "
                    f"Days to Expiry: {symbol_a} = {dte_a if dte_a is not None else 'N/A'} days, "
                    f"{symbol_b} = {dte_b if dte_b is not None else 'N/A'} days. "
                    + ("WARNING: Near-expiry tender period (< 5 DTE) may cause non-tradable settlement dislocations! " if (dte_a and dte_a <= 5) or (dte_b and dte_b <= 5) else "")
                    + ("WARNING: Low volume in one leg creates high bid-ask slippage risk." if min(vol_a, vol_b) < 100 else "Liquidity is executable across both legs.")
                ),
                
                # Question 6: Were transaction costs available and included?
                "q6_costs": (
                    f"Estimated round-trip friction is ₹{cost_per_10g:.2f}/10g "
                    f"(Brokerage + Exchange fee + CTT + GST + Slippage buffer). "
                    f"Gross Spread: ₹{gross_spread:.2f} | Net Hurdle: ₹{net_spread:+.2f}. "
                    f"Status: {cost_status}."
                ),
                
                # Question 7: What are the limitations?
                "q7_limitations": (
                    f"Statistical anomalies are NOT guaranteed arbitrage or trading signals. "
                    f"Physical delivery coin premiums (e.g. Guinea/Petal), lot size mismatches "
                    f"({spec_a['trading_unit_label']} vs {spec_b['trading_unit_label']}), and margin requirements "
                    f"can sustain dislocations longer than historical mean reversion models predict."
                ),
                
                # Question 8: What additional evidence is required?
                "q8_additional_evidence": (
                    f"Verify OTC local spot bullion premiums in Ahmedabad/Zaveri Bazaar, "
                    f"examine international COMEX-MCX landed parity basis, and check Level-2 order book depth "
                    f"before considering any execution."
                )
            }
            anomalies.append(explanation)
            
    return anomalies

def run_walk_forward_backtest(rv_result, config=None):
    """
    Performs true chronological walk-forward evaluation without look-ahead bias.
    Configurable:
    - entry_threshold: e.g. 2.0
    - exit_threshold: e.g. 0.5 (mean-reversion target)
    - stop_loss_threshold: e.g. 3.5
    - max_hold_days: e.g. 15
    - expiry_cutoff_dte: e.g. 5
    - round_trip_cost: e.g. 90.0 (₹/10g)
    - fold_train_size: e.g. 60
    - fold_test_size: e.g. 20
    """
    if "error" in rv_result:
        return {"error": rv_result["error"]}
        
    cfg = {
        "entry_threshold": 2.0,
        "exit_threshold": 0.5,
        "stop_loss_threshold": 3.5,
        "max_hold_days": 15,
        "expiry_cutoff_dte": 5,
        "min_volume": 50,
        "round_trip_cost": 90.0,
        "fold_train_size": 60,
        "fold_test_size": 20
    }
    if config:
        cfg.update(config)
        
    data = rv_result["data"]
    symbol_a = rv_result["symbol_a"]
    symbol_b = rv_result["symbol_b"]
    n = len(data)
    
    train_size = int(cfg["fold_train_size"])
    test_size = int(cfg["fold_test_size"])
    
    if n < train_size + test_size:
        return {
            "error": f"Insufficient data ({n} sessions) for train size {train_size} + test size {test_size}."
        }
        
    trades = []
    folds = []
    
    current_start = 0
    fold_idx = 1
    
    # Chronological sliding folds:
    while current_start + train_size + test_size <= n:
        train_start = current_start
        train_end = train_start + train_size
        test_start = train_end
        test_end = min(test_start + test_size, n)
        
        train_data = data[train_start:train_end]
        test_data = data[test_start:test_end]
        
        fold_trades = []
        in_trade = False
        current_trade = None
        
        for t_idx, row in enumerate(test_data):
            z = row.get('ZScore')
            dte_a = row.get('DTE_A')
            dte_b = row.get('DTE_B')
            vol_a = row.get('VolumeA', 0)
            vol_b = row.get('VolumeB', 0)
            spread = row.get('Spread')
            date = row.get('Date')
            
            min_dte = min([d for d in [dte_a, dte_b] if d is not None], default=999)
            
            # --- Check Exit if in trade ---
            if in_trade:
                hold_days = t_idx - current_trade["entry_test_idx"]
                should_exit = False
                exit_reason = ""
                
                # Exit 1: Mean reversion (|Z| <= exit_threshold)
                if z is not None and not pd.isna(z) and abs(z) <= cfg["exit_threshold"]:
                    should_exit = True
                    exit_reason = f"Mean Reversion Reached (|Z|={abs(z):.2f} <= {cfg['exit_threshold']})"
                # Exit 2: Stop loss (|Z| >= stop_loss_threshold)
                elif z is not None and not pd.isna(z) and abs(z) >= cfg["stop_loss_threshold"]:
                    should_exit = True
                    exit_reason = f"Statistical Stop Loss Triggered (|Z|={abs(z):.2f} >= {cfg['stop_loss_threshold']})"
                # Exit 3: Near expiry forced exit
                elif min_dte <= cfg["expiry_cutoff_dte"]:
                    should_exit = True
                    exit_reason = f"Expiry Cutoff Triggered (DTE={min_dte} <= {cfg['expiry_cutoff_dte']})"
                # Exit 4: Max hold days reached
                elif hold_days >= cfg["max_hold_days"]:
                    should_exit = True
                    exit_reason = f"Max Holding Period ({cfg['max_hold_days']} sessions)"
                # Exit 5: End of test fold
                elif t_idx == len(test_data) - 1:
                    should_exit = True
                    exit_reason = "Fold Period End Reached"
                    
                if should_exit:
                    exit_spread = spread
                    # P&L calculation:
                    # If SHORT_SPREAD (entered when z > 0, spread high): profit when spread falls -> entry_spread - exit_spread
                    # If LONG_SPREAD (entered when z < 0, spread low): profit when spread rises -> exit_spread - entry_spread
                    if current_trade["direction"] == "SHORT_SPREAD":
                        gross_pnl = round(current_trade["entry_spread"] - exit_spread, 2)
                    else:
                        gross_pnl = round(exit_spread - current_trade["entry_spread"], 2)
                        
                    cost = round(cfg["round_trip_cost"], 2)
                    net_pnl = round(gross_pnl - cost, 2)
                    
                    completed_trade = {
                        "trade_id": f"T_{fold_idx}_{len(fold_trades)+1}",
                        "fold_id": fold_idx,
                        "entry_date": current_trade["entry_date"],
                        "exit_date": date,
                        "direction": current_trade["direction"],
                        "entry_spread": current_trade["entry_spread"],
                        "exit_spread": exit_spread,
                        "entry_z": current_trade["entry_z"],
                        "exit_z": z if z is not None else 0.0,
                        "gross_pnl": gross_pnl,
                        "fee_deducted": cost,
                        "net_pnl": net_pnl,
                        "hold_days": hold_days,
                        "exit_reason": exit_reason,
                        "is_win": net_pnl > 0
                    }
                    fold_trades.append(completed_trade)
                    trades.append(completed_trade)
                    in_trade = False
                    current_trade = None
                    continue
                    
            # --- Check Entry if not in trade ---
            if not in_trade:
                if z is not None and not pd.isna(z) and abs(z) >= cfg["entry_threshold"]:
                    # Respect liquidity and expiry constraints
                    if min_dte > cfg["expiry_cutoff_dte"] and vol_a >= cfg["min_volume"] and vol_b >= cfg["min_volume"]:
                        direction = "SHORT_SPREAD" if z > 0 else "LONG_SPREAD"
                        in_trade = True
                        current_trade = {
                            "entry_date": date,
                            "entry_test_idx": t_idx,
                            "direction": direction,
                            "entry_spread": spread,
                            "entry_z": z
                        }
                        
        fold_net_pnl = round(sum(t["net_pnl"] for t in fold_trades), 2)
        fold_gross_pnl = round(sum(t["gross_pnl"] for t in fold_trades), 2)
        fold_wins = sum(1 for t in fold_trades if t["is_win"])
        fold_total = len(fold_trades)
        fold_win_rate = round((fold_wins / fold_total * 100), 1) if fold_total > 0 else 0.0
        
        folds.append({
            "fold_id": fold_idx,
            "train_start": train_data[0]["Date"],
            "train_end": train_data[-1]["Date"],
            "test_start": test_data[0]["Date"],
            "test_end": test_data[-1]["Date"],
            "trade_count": fold_total,
            "win_rate": fold_win_rate,
            "gross_pnl": fold_gross_pnl,
            "net_pnl": fold_net_pnl
        })
        
        current_start += test_size
        fold_idx += 1
        
    # Aggregate backtest summary
    total_trades = len(trades)
    winning_trades = sum(1 for t in trades if t["is_win"])
    total_gross = round(sum(t["gross_pnl"] for t in trades), 2)
    total_net = round(sum(t["net_pnl"] for t in trades), 2)
    total_fees = round(sum(t["fee_deducted"] for t in trades), 2)
    win_rate = round((winning_trades / total_trades * 100), 1) if total_trades > 0 else 0.0
    
    # Calculate equity curve and max drawdown
    equity = 0.0
    equity_curve = [{"trade": 0, "date": data[0]["Date"], "cumulative_net_pnl": 0.0, "drawdown": 0.0}]
    peak = 0.0
    max_dd = 0.0
    
    for idx, t in enumerate(trades):
        equity += t["net_pnl"]
        if equity > peak:
            peak = equity
        dd = peak - equity
        if dd > max_dd:
            max_dd = dd
        equity_curve.append({
            "trade": idx + 1,
            "date": t["exit_date"],
            "cumulative_net_pnl": round(equity, 2),
            "drawdown": round(dd, 2)
        })
        
    return {
        "status": "COMPLETED",
        "symbol_a": symbol_a,
        "symbol_b": symbol_b,
        "config": cfg,
        "metrics": {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": total_trades - winning_trades,
            "win_rate_pct": win_rate,
            "total_gross_pnl": total_gross,
            "total_fees_paid": total_fees,
            "total_net_pnl": total_net,
            "max_drawdown": round(max_dd, 2),
            "profit_factor": round(
                abs(sum(t["net_pnl"] for t in trades if t["net_pnl"] > 0)) / 
                max(abs(sum(t["net_pnl"] for t in trades if t["net_pnl"] < 0)), 1.0), 2
            ) if total_trades > 0 else 0.0,
            "average_hold_days": round(sum(t["hold_days"] for t in trades) / max(total_trades, 1), 1)
        },
        "folds": folds,
        "trades": trades,
        "equity_curve": equity_curve,
        "disclaimer": (
            "HISTORICAL SIMULATION DISCLAIMER: Results are derived from a chronological walk-forward "
            "simulation without look-ahead bias. Past statistical relationships do not guarantee future "
            "market performance. Round-trip transaction costs, physical delivery restrictions, and liquidity "
            "variations will affect executable results in live MCX trading."
        )
    }

if __name__ == "__main__":
    # Smoke test validation and calculation
    print("Testing specs and normalization...")
    norm_test = normalize_price("GOLDGUINEA", 54000.0)
    print(f"GOLDGUINEA ₹54,000 raw -> ₹{norm_test['normalized_price']} normalized ({norm_test['formula']})")
    assert norm_test['normalized_price'] == 67500.0, f"Expected 67500.0 got {norm_test['normalized_price']}"
    print("Specs and normalization OK!")
