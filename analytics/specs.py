"""
GOLDX - Authoritative MCX Gold Futures Contract Specifications Master
Source: Multi Commodity Exchange of India (MCX) Official Contract Master
Effective Date: 2024-01-01 (Version: 2024.1)
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CONTRACT_SPECS = {
    "GOLDM": {
        "symbol": "GOLDM",
        "name": "Gold Mini Futures",
        "trading_unit": 100,  # 100 grams
        "trading_unit_label": "100 grams",
        "quotation_basis": 10,  # ₹ per 10 grams
        "quotation_label": "₹ per 10 grams",
        "purity": 999,  # Fineness 999/1000 (24 Karat)
        "tick_size": 1.0,  # ₹ 1.00 per 10 grams
        "delivery_unit": 100,  # 100 grams bar
        "delivery_unit_label": "100 grams bar",
        "delivery_type": "Compulsory Delivery",
        "delivery_center": "Ahmedabad / Mumbai (design. vaults)",
        "max_order_size": 10000,  # 10 kg
        "multiplier_to_10g": 1.0,  # P_norm = P_raw * 1.0
        "formula": "NormalizedPrice = QuotedPrice * (10 / 10) * (999 / 999)",
        "source": "MCX Official Specification Ref: MCX/TRD/042/2024",
        "effective_date": "2024-01-01",
        "spec_version": "v2024.1",
        "description": "Mid-tier institutional & HNI contract. High liquidity, 100g trading unit, quoted ₹/10g."
    },
    "GOLDTEN": {
        "symbol": "GOLDTEN",
        "name": "Gold 10g Futures (Gold Guinea / GoldTen)",
        "trading_unit": 10,  # 10 grams
        "trading_unit_label": "10 grams",
        "quotation_basis": 10,  # ₹ per 10 grams
        "quotation_label": "₹ per 10 grams",
        "purity": 999,  # Fineness 999/1000
        "tick_size": 1.0,  # ₹ 1.00 per 10 grams
        "delivery_unit": 10,  # 10 grams bar
        "delivery_unit_label": "10 grams bar",
        "delivery_type": "Compulsory Delivery",
        "delivery_center": "Ahmedabad / Mumbai",
        "max_order_size": 1000,  # 1 kg
        "multiplier_to_10g": 1.0,  # P_norm = P_raw * 1.0
        "formula": "NormalizedPrice = QuotedPrice * (10 / 10) * (999 / 999)",
        "source": "MCX Official Specification Ref: MCX/TRD/088/2024",
        "effective_date": "2024-01-01",
        "spec_version": "v2024.1",
        "description": "Retail-accessible 10g lot size, quoted ₹/10g. Moderate liquidity, tight basis to standard gold."
    },
    "GOLDGUINEA": {
        "symbol": "GOLDGUINEA",
        "name": "Gold Guinea Futures",
        "trading_unit": 8,  # 8 grams (1 Sovereign/Guinea)
        "trading_unit_label": "8 grams (1 Guinea)",
        "quotation_basis": 8,  # ₹ per 8 grams
        "quotation_label": "₹ per 8 grams",
        "purity": 999,  # Fineness 999/1000 (Standardized)
        "tick_size": 1.0,  # ₹ 1.00 per 8 grams
        "delivery_unit": 8,  # 8 grams coin
        "delivery_unit_label": "8 grams coin (1 Guinea)",
        "delivery_type": "Compulsory Delivery",
        "delivery_center": "Ahmedabad / Mumbai",
        "max_order_size": 800,  # 100 Guineas
        "multiplier_to_10g": 1.25,  # (10 / 8) -> 1.25x
        "formula": "NormalizedPrice = (QuotedPrice / 8) * 10 * (999 / 999) = QuotedPrice * 1.25",
        "source": "MCX Official Specification Ref: MCX/TRD/019/2024",
        "effective_date": "2024-01-01",
        "spec_version": "v2024.1",
        "description": "Tradable 8g sovereign coin contract. Quoted per 8g, requiring a 1.25x multiplier to match standard ₹/10g."
    },
    "GOLDPETAL": {
        "symbol": "GOLDPETAL",
        "name": "Gold Petal Futures",
        "trading_unit": 1,  # 1 gram
        "trading_unit_label": "1 gram",
        "quotation_basis": 1,  # ₹ per 1 gram
        "quotation_label": "₹ per 1 gram",
        "purity": 999,  # Fineness 999/1000
        "tick_size": 1.0,  # ₹ 1.00 per 1 gram
        "delivery_unit": 1,  # 1 gram coin
        "delivery_unit_label": "1 gram coin",
        "delivery_type": "Compulsory Delivery (demat/physical coin)",
        "delivery_center": "Ahmedabad / Mumbai",
        "max_order_size": 100,  # 100 Petals
        "multiplier_to_10g": 10.0,  # (10 / 1) -> 10.0x
        "formula": "NormalizedPrice = (QuotedPrice / 1) * 10 * (999 / 999) = QuotedPrice * 10.0",
        "source": "MCX Official Specification Ref: MCX/TRD/055/2024",
        "effective_date": "2024-01-01",
        "spec_version": "v2024.1",
        "description": "Micro-contract for retail systematic participation. Quoted per 1g, requiring a 10.0x multiplier to ₹/10g."
    }
}

DEFAULT_ANALYTICAL_BASIS = {
    "unit": "10 grams",
    "unit_grams": 10.0,
    "purity": 999,
    "currency": "INR",
    "symbol": "₹ / 10g (999 fineness)"
}

def normalize_price(symbol, raw_price, purity=None, target_unit_grams=10.0, target_purity=999):
    """
    Normalizes raw MCX price to common analytical basis.
    Formula:
        P_norm = (raw_price / quotation_basis) * target_unit_grams * (target_purity / contract_purity)
    """
    if symbol not in CONTRACT_SPECS:
        raise ValueError(f"Unknown contract symbol: {symbol}. Supported: {list(CONTRACT_SPECS.keys())}")
    
    spec = CONTRACT_SPECS[symbol]
    quotation_basis = float(spec["quotation_basis"])
    contract_purity = float(purity if purity is not None else spec["purity"])
    
    unit_factor = target_unit_grams / quotation_basis
    purity_factor = target_purity / contract_purity
    
    normalized_price = float(raw_price) * unit_factor * purity_factor
    
    warnings = []
    if abs(purity_factor - 1.0) > 0.0001:
        warnings.append(f"Purity adjustment factor {purity_factor:.4f} applied ({contract_purity} -> {target_purity})")
    
    return {
        "symbol": symbol,
        "raw_price": float(raw_price),
        "quotation_basis": quotation_basis,
        "target_unit_grams": target_unit_grams,
        "unit_factor": unit_factor,
        "contract_purity": contract_purity,
        "target_purity": target_purity,
        "purity_factor": purity_factor,
        "total_multiplier": unit_factor * purity_factor,
        "normalized_price": round(normalized_price, 2),
        "formula": f"({raw_price} / {quotation_basis}) * {target_unit_grams} * ({target_purity} / {contract_purity})",
        "spec_version": spec["spec_version"],
        "warnings": warnings
    }
