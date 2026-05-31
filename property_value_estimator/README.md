# e-Rumah Property Value Estimator — ML Pipeline

---

## Overview

This pipeline trains the XGBoost-based Automated Valuation Model (AVM) that powers e-Rumah's property value estimation feature. It takes raw NAPIC transaction data as input and produces a versioned model bundle consumed by the FastAPI inference endpoint.

The pipeline addresses the key limitations of the baseline model by introducing **five feature engineering improvements** and **Optuna-based hyperparameter tuning**, targeting a final R² of 0.87–0.91 and MAPE of 12–16%.

---

## What Changed from Baseline

| #   | Improvement                                                   | Why it helps                                                        |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | **State-level feature** derived from district mapping         | Lets the model learn Klang Valley vs Sabah price levels explicitly  |
| 2   | **Scheme-level target encoding** (`scheme_logprice`)          | Micro-location price anchor — finer than district/mukim alone       |
| 3   | **District-period rolling median** (`district_period_median`) | Captures post-pandemic price trend per area across 2021–2025        |
| 4   | **`is_high_rise` flag + proper `unit_level` handling**        | Distinguishes landed (no level) from strata/high-rise without noise |
| 5   | **Cyclical month encoding** (`month_sin`, `month_cos`)        | Correctly encodes seasonality; avoids Dec→Jan discontinuity         |
| 6   | **Optuna hyperparameter tuning** (60 trials, 5-fold CV)       | Systematic search over 9 XGBoost parameters                         |
| 7   | **Time-based train/test split** (2024+ = test)                | Evaluates true out-of-sample generalization, not data leakage       |

`price_per_sqm` features are **intentionally excluded** — end users (senior homeowners) do not have access to this information at inference time.

---

## Requirements

```bash
pip install xgboost scikit-learn pandas numpy optuna shap joblib matplotlib
```

Tested with:

- Python 3.10+
- XGBoost 2.x
- scikit-learn 1.3+
- Optuna 3.x

---

## Usage

### Train

```bash
python pipeline.py
```

By default this runs 60 Optuna trials and generates SHAP plots. Adjust at the bottom of `pipeline.py`:

```python
bundle = train_pipeline(n_optuna_trials=60, run_shap=True)
```

Outputs saved to `./models/`:

- `xgb_erumah_latest.pkl` — model bundle for FastAPI
- `xgb_erumah_YYYYMMDD_HHMM.pkl` — versioned snapshot
- `shap_feature_importance.png` — bar chart of top features
- `shap_beeswarm.png` — SHAP beeswarm for direction + magnitude

### Inference (Python)

```python
import joblib
from pipeline import predict_property_value

bundle = joblib.load("models/xgb_erumah_latest.pkl")

result = predict_property_value(
    bundle        = bundle,
    property_type = "1 - 1 1/2 Storey Semi-Detached",
    district      = "Petaling",
    mukim         = "Damansara",
    scheme_name   = "TMN SS2",
    tenure        = "Freehold",
    floor_area_sqm = 150.0,
    land_area_sqm  = 200.0,
    unit_level     = None,     # None for landed property
    txn_year       = 2025,
    txn_month      = 6,
)

print(result)
# {
#   "estimated_value_rm":  750000,
#   "confidence_low_rm":   637000,
#   "confidence_high_rm":  862000,
#   "confidence_band_pct": 15.0,
#   "model_version":       "20250601_1430"
# }
```

### FastAPI Integration

Load the bundle once at startup:

```python
from fastapi import FastAPI
import joblib
from pipeline import predict_property_value

app    = FastAPI()
bundle = joblib.load("models/xgb_erumah_latest.pkl")

@app.post("/api/v1/estimate")
def estimate(payload: PropertyEstimateRequest):
    return predict_property_value(bundle=bundle, **payload.dict())
```

The confidence band defaults to ±15% (matching the model's expected MAPE). This can be tightened as the model is retrained with more data.

---

## Feature Reference

| Feature                  | Type    | Source         | Notes                           |
| ------------------------ | ------- | -------------- | ------------------------------- |
| `floor_area_sqm`         | numeric | NAPIC          | Main floor area                 |
| `land_area_sqm`          | numeric | NAPIC          | Land/parcel area                |
| `area_ratio`             | numeric | derived        | `floor / land` — internal only  |
| `unit_level_num`         | numeric | NAPIC          | 0 for landed property           |
| `is_freehold`            | binary  | NAPIC          | 1 = Freehold, 0 = Leasehold     |
| `is_high_rise`           | binary  | derived        | 1 if unit level is present      |
| `txn_year`               | numeric | NAPIC          | Transaction year                |
| `month_sin`              | numeric | derived        | Cyclical month encoding         |
| `month_cos`              | numeric | derived        | Cyclical month encoding         |
| `scheme_logprice`        | numeric | target-encoded | Median log price for the scheme |
| `district_period_median` | numeric | target-encoded | District median per year-month  |
| `state_logprice`         | numeric | target-encoded | State-level median log price    |
| `property_type_enc`      | encoded | NAPIC          | Label-encoded                   |
| `district_enc`           | encoded | NAPIC          | Label-encoded                   |
| `mukim_enc`              | encoded | NAPIC          | Label-encoded                   |
| `tenure_enc`             | encoded | NAPIC          | Label-encoded                   |
| `state_enc`              | encoded | derived        | Label-encoded                   |

---

## Model Bundle Contents

The `.pkl` file is a dictionary with the following keys:

| Key           | Description                                    |
| ------------- | ---------------------------------------------- |
| `model`       | Fitted `XGBRegressor`                          |
| `encoders`    | Dict of `LabelEncoder`s + target encoding maps |
| `features`    | Ordered list of feature column names           |
| `target`      | `"log_price"`                                  |
| `best_params` | Optuna-selected hyperparameters                |
| `metrics`     | Test-set MAE, RMSE, R², MAPE, CV R²            |
| `version`     | Timestamp string `YYYYMMDD_HHMM`               |

---

## Expected Performance

| Metric    | Baseline    | Target (after improvements) |
| --------- | ----------- | --------------------------- |
| R²        | 0.777       | 0.87 – 0.91                 |
| MAPE      | 23.6%       | 12 – 16%                    |
| MAE       | ~RM 103,000 | ~RM 50,000 – 70,000         |
| CV R² std | 0.0053      | < 0.010                     |

> Performance will vary by property type and region. Strata properties in Kuala Lumpur/Selangor tend to have tighter predictions than rural landed properties in East Malaysia due to transaction density.

---

## Known Limitations

- **No property age data** — NAPIC transactions do not include year built. This is the single largest remaining source of unexplained variance.
- **Sparse coverage for East Malaysia** — fewer transactions in Sabah/Sarawak reduce scheme-level encoding reliability for those regions.
- **Static scheme encoding** — the scheme target encoding is computed on the training set and will become stale as market conditions shift. Recommend retraining every 6–12 months.
- **Confidence band is symmetric** — the ±15% band is a simplification; actual error distributions may be skewed for very high-value or very low-value properties.

---

## Retraining

When new NAPIC data is available:

1. Append new rows to `data/napic_transactions.csv`
2. Re-run `python pipeline.py`
3. The new `xgb_erumah_latest.pkl` is picked up automatically by FastAPI on next restart (or hot-reload)

---

## Academic Reference

This pipeline is documented in Chapter 4 of the e-Rumah FYP report under **Section 4.x: Property Value Estimator — ML Methodology**, covering feature engineering, algorithm selection, k-fold cross-validation, evaluation metrics (MAE, RMSE, R², MAPE), SHAP interpretability, and RESTful API integration.
