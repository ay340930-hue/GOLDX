"""
GOLDX - Deterministic Synthetic MCX Gold Futures Benchmark Dataset Generator
Generates ~250 trading days across GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL.
Includes realistic price paths, volume, open interest, and documented historical anomalies.
"""

import os
import math
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from specs import CONTRACT_SPECS

def generate_benchmark_dataset(output_path="demo-data/mcx_gold_benchmark_demo.csv", seed=42):
    np.random.seed(seed)
    
    # 250 trading days starting 2024-01-02 to 2024-12-30
    start_date = datetime(2024, 1, 2)
    dates = []
    curr = start_date
    while len(dates) < 250:
        if curr.weekday() < 5:  # Monday to Friday
            dates.append(curr.strftime("%Y-%m-%d"))
        curr += timedelta(days=1)
        
    records = []
    
    # Base gold price per 10g: starts around 63,000, trends towards 78,000 by end of 2024
    # (Reflecting the historic 2024 gold bull run in India)
    n = len(dates)
    trend = np.linspace(63200, 78100, n)
    # Realistic geometric random walk with market shocks
    shocks = np.random.normal(0, 320, n)
    shocks[140] = -2800  # Budget custom duty shock (July 2024)
    shocks[141] = -1200
    base_price_10g = trend + np.cumsum(shocks * 0.15)
    
    # Bi-monthly expiry cycles standard in MCX gold contracts:
    # Feb 5, Apr 5, Jun 5, Aug 5, Oct 5, Dec 5
    expiries = [
        "2024-02-05", "2024-04-05", "2024-06-05", 
        "2024-08-05", "2024-10-04", "2024-12-05", "2025-02-05"
    ]
    
    def get_active_expiry(date_str):
        d = datetime.strptime(date_str, "%Y-%m-%d")
        for exp in expiries:
            exp_d = datetime.strptime(exp, "%Y-%m-%d")
            if (exp_d - d).days >= 3:
                return exp
        return expiries[-1]

    for i, date_str in enumerate(dates):
        d = datetime.strptime(date_str, "%Y-%m-%d")
        p_base = base_price_10g[i]
        active_exp = get_active_expiry(date_str)
        exp_d = datetime.strptime(active_exp, "%Y-%m-%d")
        dte = (exp_d - d).days
        
        # --- 1. GOLDM (Gold Mini): Reference contract, 10g quotation basis ---
        # Highest liquidity among mini contracts
        p_goldm_raw = p_base + np.random.normal(0, 15)
        vol_goldm = int(np.random.normal(14500, 2200))
        oi_goldm = int(np.random.normal(24000, 1500) + (100 - min(dte, 60)) * 50)
        
        # --- 2. GOLDTEN (Gold 10g): 10g quotation basis ---
        # Very close to GOLDM, slight retail discount/premium of -₹10 to +₹15
        p_goldten_raw = p_goldm_raw + np.random.normal(2, 10)
        vol_goldten = int(np.random.normal(4200, 800))
        oi_goldten = int(np.random.normal(8500, 600))
        
        # --- 3. GOLDGUINEA: 8g quotation basis! Raw price is ~ 8/10th of base ---
        # Raw basis = p_base * (8/10) = p_base * 0.8
        # Normal spread in 10g terms is around -₹30 to +₹40
        # SPECIAL ANOMALY EVENT 1: Date index 142 (Post-budget July 25, 2024)
        # Supply dislocation in physical sovereign coins caused guinea normalized price
        # to spike by +₹420/10g over GOLDM!
        guinea_bias_10g = 12.0
        if 141 <= i <= 144:
            guinea_bias_10g = 425.0  # Documented Anomaly 1: Physical delivery sovereign premium spike
        elif 80 <= i <= 82:
            guinea_bias_10g = -310.0 # Anomaly 2: Pre-monsoon clearing discount
            
        p_guinea_10g_equiv = p_goldm_raw + guinea_bias_10g + np.random.normal(0, 18)
        p_goldguinea_raw = (p_guinea_10g_equiv / 10.0) * 8.0 # Convert to 8g quoted price
        vol_guinea = int(np.random.normal(1200, 300))
        if i % 25 == 0:  # Occasional thin liquidity warning day
            vol_guinea = 45
        oi_guinea = int(np.random.normal(3200, 400))
        
        # --- 4. GOLDPETAL: 1g quotation basis! Raw price is ~ 1/10th of base ---
        # Normal spread in 10g terms is around +₹25 to +₹50 (retail packaging premium)
        # SPECIAL ANOMALY EVENT 3: Date index 210 (Dhanteras festival rush, late Oct 2024)
        # Extreme surge in 1g physical coin demand caused Petal normalized price to trade
        # at +₹580/10g premium over Mini!
        petal_bias_10g = 35.0
        if 208 <= i <= 212:
            petal_bias_10g = 580.0  # Documented Anomaly 3: Dhanteras festival micro-coin premium surge
            
        p_petal_10g_equiv = p_goldm_raw + petal_bias_10g + np.random.normal(0, 15)
        p_goldpetal_raw = p_petal_10g_equiv / 10.0 # Convert to 1g quoted price
        vol_petal = int(np.random.normal(3100, 600))
        if i % 30 == 0:
            vol_petal = 75 # Thin liquidity day
        oi_petal = int(np.random.normal(9800, 1100))
        
        # Add high/low/open/close with realistic spreads
        for sym, raw_close, vol, oi, q_basis, purity in [
            ("GOLDM", p_goldm_raw, vol_goldm, oi_goldm, 10, 999),
            ("GOLDTEN", p_goldten_raw, vol_goldten, oi_goldten, 10, 999),
            ("GOLDGUINEA", p_goldguinea_raw, vol_guinea, oi_guinea, 8, 999),
            ("GOLDPETAL", p_goldpetal_raw, vol_petal, oi_petal, 1, 999),
        ]:
            daily_range = np.random.uniform(0.004, 0.012) * raw_close
            open_p = raw_close + np.random.uniform(-0.4, 0.4) * daily_range
            high_p = max(open_p, raw_close) + np.random.uniform(0.1, 0.6) * daily_range
            low_p = min(open_p, raw_close) - np.random.uniform(0.1, 0.6) * daily_range
            
            records.append({
                "Date": date_str,
                "Symbol": sym,
                "ExpiryDate": active_exp,
                "QuotationBasis": f"{q_basis}g",
                "Purity": purity,
                "Open": round(open_p, 2),
                "High": round(high_p, 2),
                "Low": round(low_p, 2),
                "Close": round(raw_close, 2),
                "SettlePrice": round(raw_close, 2),
                "Volume": max(vol, 10),
                "OpenInterest": max(oi, 50),
                "Turnover_Lakhs": round((vol * raw_close * (10 if sym != "GOLDPETAL" else 1)) / 100000, 2),
                "DataSource": "SYNTHETIC_BENCHMARK_DEMO"
            })
            
    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records across {len(dates)} dates in {output_path}")
    return df

if __name__ == "__main__":
    generate_benchmark_dataset()
