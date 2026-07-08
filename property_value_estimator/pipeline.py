import re
import math
import warnings
import joblib
import numpy as np
import pandas as pd

from pathlib import Path
from datetime import datetime

from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

import xgboost as xgb

# optuna, shap and matplotlib are training-only dependencies; they are
# imported lazily inside tune_xgboost() / shap_analysis() so the API can
# serve predictions without them installed.

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# 0. PATHS
# ─────────────────────────────────────────────
MODULE_DIR = Path(__file__).resolve().parent
DATA_PATH   = MODULE_DIR / "Open Transaction Data.csv"
OUTPUT_DIR  = MODULE_DIR / "models"
OUTPUT_DIR.mkdir(exist_ok=True)


def normalize_scheme_name(value: str) -> str:
    normalized = str(value).strip().upper()
    return re.sub(r"\bTAMAN\b", "TMN", normalized)

# ─────────────────────────────────────────────
# 1. DISTRICT → STATE MAPPING
#    Covers all 16 states/FTs in Malaysia.
#    Extend as needed for districts not listed.
# ─────────────────────────────────────────────
DISTRICT_STATE_MAP = {
    # Selangor
    "Petaling": "Selangor", "Klang": "Selangor", "Gombak": "Selangor",
    "Hulu Langat": "Selangor", "Sepang": "Selangor", "Kuala Langat": "Selangor",
    "Sabak Bernam": "Selangor", "Kuala Selangor": "Selangor", "Hulu Selangor": "Selangor",
    # Kuala Lumpur
    "Kuala Lumpur": "W.P. Kuala Lumpur",
    # Pulau Pinang
    "Timur Laut": "Pulau Pinang", "Barat Daya": "Pulau Pinang",
    "Seberang Perai Utara": "Pulau Pinang", "Seberang Perai Tengah": "Pulau Pinang",
    "Seberang Perai Selatan": "Pulau Pinang",
    # Johor
    "Johor Bahru": "Johor", "Iskandar Puteri": "Johor", "Kluang": "Johor",
    "Mersing": "Johor", "Muar": "Johor", "Segamat": "Johor",
    "Pontian": "Johor", "Kota Tinggi": "Johor", "Kulai": "Johor",
    "Batu Pahat": "Johor",
    # Melaka
    "Alor Gajah": "Melaka", "Jasin": "Melaka", "Melaka Tengah": "Melaka",
    # Perak
    "Ipoh": "Perak", "Kinta": "Perak", "Larut Dan Matang": "Perak",
    "Manjung": "Perak", "Batang Padang": "Perak", "Hilir Perak": "Perak",
    "Hulu Perak": "Perak", "Kerian": "Perak", "Kuala Kangsar": "Perak",
    "Perak Tengah": "Perak", "Selama": "Perak", "Ulu Kinta": "Perak",
    # Negeri Sembilan
    "Seremban": "Negeri Sembilan", "Port Dickson": "Negeri Sembilan",
    "Jelebu": "Negeri Sembilan", "Tampin": "Negeri Sembilan",
    "Jempol": "Negeri Sembilan", "Rembau": "Negeri Sembilan",
    "Kuala Pilah": "Negeri Sembilan",
    # Pahang
    "Kuantan": "Pahang", "Temerloh": "Pahang", "Bentong": "Pahang",
    "Cameron Highlands": "Pahang", "Jerantut": "Pahang",
    "Lipis": "Pahang", "Raub": "Pahang", "Rompin": "Pahang",
    "Pekan": "Pahang", "Maran": "Pahang", "Bera": "Pahang",
    # Kelantan
    "Kota Bharu": "Kelantan", "Pasir Mas": "Kelantan", "Tanah Merah": "Kelantan",
    "Bachok": "Kelantan", "Tumpat": "Kelantan",
    # Terengganu
    "Kuala Terengganu": "Terengganu", "Kemaman": "Terengganu",
    "Dungun": "Terengganu", "Besut": "Terengganu", "Marang": "Terengganu",
    # Kedah
    "Kota Setar": "Kedah", "Kuala Muda": "Kedah", "Kubang Pasu": "Kedah",
    "Baling": "Kedah", "Kulim": "Kedah", "Langkawi": "Kedah",
    "Padang Terap": "Kedah", "Pendang": "Kedah", "Sik": "Kedah",
    # Perlis
    "Kangar": "Perlis", "Arau": "Perlis",
    # Sabah
    "Kota Kinabalu": "Sabah", "Sandakan": "Sabah", "Tawau": "Sabah",
    "Lahad Datu": "Sabah", "Keningau": "Sabah", "Penampang": "Sabah",
    "Papar": "Sabah", "Ranau": "Sabah",
    # Sarawak
    "Kuching": "Sarawak", "Miri": "Sarawak", "Sibu": "Sarawak",
    "Bintulu": "Sarawak", "Sri Aman": "Sarawak",
    # Putrajaya / Labuan
    "Putrajaya": "W.P. Putrajaya",
    "Labuan": "W.P. Labuan",
}

# ─────────────────────────────────────────────
# 2. DATA LOADING & INITIAL CLEANING
# ─────────────────────────────────────────────
def load_and_clean(path: Path) -> pd.DataFrame:
    def _read_csv_fallback(path_):
        encodings = ["utf-8", "utf-8-sig", "utf-16", "latin1"]
        seps = ["\t", ",", ";"]
        last_exc = None
        for enc in encodings:
            for sep in seps:
                try:
                    return pd.read_csv(path_, sep=sep, dtype=str, encoding=enc,
                                       engine="python", on_bad_lines="skip")
                except UnicodeDecodeError as e:
                    last_exc = e
                    break
                except Exception as e:
                    last_exc = e
                    continue
        # final fallback: read with latin1 and default separator
        try:
            return pd.read_csv(path_, dtype=str, encoding="latin1", engine="python", on_bad_lines="skip")
        except Exception:
            # re-raise the last encoding/parse exception for visibility
            raise last_exc

    df = _read_csv_fallback(path)

    # Normalise column names
    df.columns = (
        df.columns.str.strip()
                  .str.lower()
                  .str.replace(r"[\s/,]+", "_", regex=True)
                  .str.replace(r"[^a-z0-9_]", "", regex=True)
    )

    # ── Transaction price ──────────────────────
    df["transaction_price"] = (
        df["transaction_price"]
          .str.replace(r"[^\d.]", "", regex=True)
          .pipe(pd.to_numeric, errors="coerce")
    )

    # ── Month / Year of transaction ───────────
    df["txn_date"] = pd.to_datetime(
        df["month_year_of_transaction_date"].str.strip(),
        format="%B %Y",
        errors="coerce"
    )
    df["txn_year"]  = df["txn_date"].dt.year
    df["txn_month"] = df["txn_date"].dt.month

    # ── Area columns ──────────────────────────
    def parse_area(col):
        return pd.to_numeric(
            df[col].astype(str).str.replace(r"[^\d.]", "", regex=True),
            errors="coerce"
        )

    # try to detect land area column
    land_cols = [c for c in df.columns if "land" in c and "area" in c]
    if not land_cols:
        land_cols = [c for c in df.columns if c in ("landparcel_area", "land_area", "landarea", "landparcelarea")]
    if not land_cols:
        raise KeyError(f"No land area column found. Available columns: {list(df.columns)}")
    land_col = land_cols[0]

    # try to detect floor area column
    floor_cols = [c for c in df.columns if "floor" in c and "area" in c]
    if not floor_cols:
        floor_cols = [c for c in df.columns if c in ("main_floor_area", "floorarea", "built_up_area", "builtuparea")]
    if not floor_cols:
        raise KeyError(f"No floor area column found. Available columns: {list(df.columns)}")
    floor_col = floor_cols[0]

    df["land_area_sqm"]  = parse_area(land_col)
    df["floor_area_sqm"] = parse_area(floor_col)

    # ── Tenure ────────────────────────────────
    df["tenure_clean"] = df["tenure"].str.strip().str.lower()
    df["is_freehold"]  = (df["tenure_clean"] == "freehold").astype(int)

    # ── Unit level ────────────────────────────
    df["unit_level_num"] = pd.to_numeric(
        df["unit_level"].astype(str).str.extract(r"(\d+)")[0],
        errors="coerce"
    )
    df["is_high_rise"]   = df["unit_level_num"].notna().astype(int)
    df["unit_level_num"] = df["unit_level_num"].fillna(0).astype(int)

    # ── String columns ────────────────────────
    for col in ["property_type", "district", "mukim", "tenure"]:
        df[col] = df[col].astype(str).str.strip()

    scheme_col = [c for c in df.columns if "scheme" in c or "area" in c]
    if scheme_col:
        df["scheme_name"] = df[scheme_col[0]].map(normalize_scheme_name)
    else:
        df["scheme_name"] = "UNKNOWN"

    # ── Drop rows missing critical values ─────
    df.dropna(subset=["transaction_price", "txn_year", "floor_area_sqm"], inplace=True)

    # ── Remove obvious outliers (< 10k or > 50M) ──
    df = df[(df["transaction_price"] >= 10_000) & (df["transaction_price"] <= 50_000_000)]

    # ── Log-transform target ──────────────────
    df["log_price"] = np.log(df["transaction_price"])

    print(f"[load] {len(df):,} rows after cleaning")
    return df

# ─────────────────────────────────────────────
# 3. FEATURE ENGINEERING
# ─────────────────────────────────────────────
def engineer_features(df: pd.DataFrame, fit_mode: bool = True,
                       encoders: dict = None) -> tuple[pd.DataFrame, dict]:
    """
    fit_mode=True  → compute + store encoding stats (training)
    fit_mode=False → apply stored encoding stats (inference)
    """
    if encoders is None:
        encoders = {}

    # ── 3a. State ─────────────────────────────
    df["state"] = df["district"].map(DISTRICT_STATE_MAP).fillna("Other")

    # ── 3b. Cyclical month encoding ───────────
    df["month_sin"] = np.sin(2 * math.pi * df["txn_month"] / 12)
    df["month_cos"] = np.cos(2 * math.pi * df["txn_month"] / 12)

    # ── 3c. Area ratio (model-internal only) ──
    df["area_ratio"] = (df["floor_area_sqm"] / df["land_area_sqm"].replace(0, np.nan)).fillna(0)

    # ── 3d. Scheme-level target encoding ──────
    if fit_mode:
        scheme_med = df.groupby("scheme_name")["log_price"].median()
        encoders["scheme_median"] = scheme_med
    df["scheme_logprice"] = (
        df["scheme_name"]
          .map(encoders["scheme_median"])
          .fillna(df["log_price"].median() if fit_mode else encoders["global_median"])
    )

    # ── 3e. District-period rolling median ────
    df["ym"] = df["txn_year"].astype(str) + "-" + df["txn_month"].astype(str).str.zfill(2)

    if fit_mode:
        dist_period_med = df.groupby(["district", "ym"])["log_price"].median()
        encoders["dist_period_median"] = dist_period_med
        encoders["global_median"]      = df["log_price"].median()

    df["district_period_median"] = df.set_index(["district", "ym"]).index.map(
        encoders["dist_period_median"]
    ).fillna(encoders["global_median"])

    # ── 3f. State-level median ────────────────
    if fit_mode:
        state_med = df.groupby("state")["log_price"].median()
        encoders["state_median"] = state_med
    df["state_logprice"] = (
        df["state"]
          .map(encoders["state_median"])
          .fillna(encoders["global_median"])
    )

    # ── 3g. Label-encode remaining categoricals ─
    cat_cols = ["property_type", "district", "mukim", "tenure", "state"]
    for col in cat_cols:
        key = f"le_{col}"
        if fit_mode:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[key] = le
        else:
            le = encoders[key]
            df[col + "_enc"] = df[col].astype(str).map(
                lambda x, le=le: le.transform([x])[0]
                if x in le.classes_ else -1
            )

    print("[engineer] Feature engineering done")
    return df, encoders

# ─────────────────────────────────────────────
# 4. FEATURE LIST
# ─────────────────────────────────────────────
FEATURES = [
    # Raw numeric
    "floor_area_sqm", "land_area_sqm", "area_ratio",
    "unit_level_num", "is_freehold", "is_high_rise",
    "txn_year",
    # Cyclical time
    "month_sin", "month_cos",
    # Target-encoded location features (micro → macro)
    "scheme_logprice", "district_period_median", "state_logprice",
    # Label-encoded categoricals
    "property_type_enc", "district_enc", "mukim_enc", "tenure_enc", "state_enc",
]
TARGET = "log_price"

# ─────────────────────────────────────────────
# 5. OPTUNA HYPERPARAMETER TUNING
# ─────────────────────────────────────────────
def tune_xgboost(X_train: pd.DataFrame, y_train: pd.Series,
                 n_trials: int = 60) -> dict:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)

    kf = KFold(n_splits=5, shuffle=True, random_state=42)

    def objective(trial):
        params = {
            "n_estimators":      trial.suggest_int("n_estimators", 300, 1000),
            "max_depth":         trial.suggest_int("max_depth", 3, 9),
            "learning_rate":     trial.suggest_float("learning_rate", 0.01, 0.15, log=True),
            "subsample":         trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree":  trial.suggest_float("colsample_bytree", 0.6, 1.0),
            "min_child_weight":  trial.suggest_int("min_child_weight", 1, 10),
            "reg_alpha":         trial.suggest_float("reg_alpha", 1e-3, 10.0, log=True),
            "reg_lambda":        trial.suggest_float("reg_lambda", 1e-3, 10.0, log=True),
            "gamma":             trial.suggest_float("gamma", 0.0, 1.0),
            "tree_method":       "hist",
            "random_state":      42,
            "n_jobs":            -1,
        }
        model  = xgb.XGBRegressor(**params)
        scores = cross_val_score(model, X_train, y_train,
                                 cv=kf, scoring="r2", n_jobs=-1)
        return scores.mean()

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
    print(f"[tune] Best CV R² = {study.best_value:.4f}")
    print(f"[tune] Best params: {study.best_params}")
    return study.best_params

# ─────────────────────────────────────────────
# 6. EVALUATION HELPERS
# ─────────────────────────────────────────────
def evaluate(y_true_log, y_pred_log, label=""):
    y_true = np.exp(y_true_log)
    y_pred = np.exp(y_pred_log)

    mae  = mean_absolute_error(y_true, y_pred)
    rmse = math.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true_log, y_pred_log)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100

    print(f"\n{'─'*40}")
    print(f"  {label}")
    print(f"  MAE   : RM {mae:>12,.0f}")
    print(f"  RMSE  : RM {rmse:>12,.0f}")
    print(f"  R²    : {r2:.4f}")
    print(f"  MAPE  : {mape:.2f}%")
    print(f"{'─'*40}")
    return {"MAE (RM)": round(mae, 2), "RMSE (RM)": round(rmse, 2),
            "R²": round(r2, 4), "MAPE (%)": round(mape, 2)}

# ─────────────────────────────────────────────
# 7. SHAP ANALYSIS
# ─────────────────────────────────────────────
def shap_analysis(model, X_sample: pd.DataFrame):
    import shap
    import matplotlib.pyplot as plt

    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_sample, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "shap_feature_importance.png", dpi=150)
    plt.close()

    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_sample, show=False)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "shap_beeswarm.png", dpi=150)
    plt.close()

    print("[shap] Plots saved →", OUTPUT_DIR)

# ─────────────────────────────────────────────
# 8. MAIN TRAINING PIPELINE
# ─────────────────────────────────────────────
def train_pipeline(data_path: Path = DATA_PATH,
                   n_optuna_trials: int = 60,
                   run_shap: bool = True):

    # ── Load ──────────────────────────────────
    df = load_and_clean(data_path)

    # ── Feature engineering (fit mode) ────────
    df, encoders = engineer_features(df, fit_mode=True)

    # ── Train / test split (time-based: 2024+ = test) ──
    train_df = df[df["txn_year"] < 2024].copy()
    test_df  = df[df["txn_year"] >= 2024].copy()

    X_train = train_df[FEATURES]
    y_train = train_df[TARGET]
    X_test  = test_df[FEATURES]
    y_test  = test_df[TARGET]

    print(f"[split] Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    # ── Optuna tuning ─────────────────────────
    print("\n[tune] Starting Optuna XGBoost tuning …")
    best_params = tune_xgboost(X_train, y_train, n_trials=n_optuna_trials)

    # ── Final XGBoost model ───────────────────
    best_params.update({"tree_method": "hist", "random_state": 42, "n_jobs": -1})
    xgb_model = xgb.XGBRegressor(**best_params)
    xgb_model.fit(X_train, y_train,
                  eval_set=[(X_test, y_test)],
                  verbose=False)

    xgb_results = evaluate(y_test, xgb_model.predict(X_test), "XGBoost (Tuned)")

    # ── Cross-validation on full training set ─
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(xgb_model, X_train, y_train, cv=kf, scoring="r2")
    print(f"\n[cv] XGBoost CV R² = {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    xgb_results["CV R² mean"] = round(cv_scores.mean(), 4)
    xgb_results["CV R² std"]  = round(cv_scores.std(), 4)

    # ── Random Forest (comparison) ────────────
    rf_model = RandomForestRegressor(n_estimators=300, n_jobs=-1, random_state=42)
    rf_model.fit(X_train, y_train)
    evaluate(y_test, rf_model.predict(X_test), "Random Forest (Comparison)")

    # ── SHAP ──────────────────────────────────
    if run_shap:
        shap_sample = X_test.sample(min(2000, len(X_test)), random_state=42)
        shap_analysis(xgb_model, shap_sample)

    # ── Save artefacts ────────────────────────
    version = datetime.now().strftime("%Y%m%d_%H%M")
    model_bundle = {
        "model":       xgb_model,
        "encoders":    encoders,
        "features":    FEATURES,
        "target":      TARGET,
        "best_params": best_params,
        "metrics":     xgb_results,
        "version":     version,
    }

    out_path = OUTPUT_DIR / f"xgb_erumah_{version}.pkl"
    joblib.dump(model_bundle, out_path)
    # Also save as "latest" for FastAPI to load
    joblib.dump(model_bundle, OUTPUT_DIR / "xgb_erumah_latest.pkl")
    print(f"\n[save] Model bundle → {out_path}")
    print(f"[save] Latest alias  → {OUTPUT_DIR / 'xgb_erumah_latest.pkl'}")

    return model_bundle

# ─────────────────────────────────────────────
# 9. INFERENCE HELPER (used by FastAPI)
# ─────────────────────────────────────────────
def predict_property_value(
    bundle: dict,
    property_type: str,
    district: str,
    mukim: str,
    scheme_name: str,
    tenure: str,
    floor_area_sqm: float,
    land_area_sqm: float,
    unit_level: int | None,
    txn_year: int,
    txn_month: int,
    confidence_pct: float = 0.15,
) -> dict:
    """
    Returns point estimate + confidence band in RM.
    confidence_pct=0.15 → ±15% band (adjust based on model MAPE).
    """
    row = pd.DataFrame([{
        "property_type":  property_type,
        "district":       district,
        "mukim":          mukim,
        "scheme_name":    normalize_scheme_name(scheme_name),
        "tenure":         tenure,
        "floor_area_sqm": floor_area_sqm,
        "land_area_sqm":  land_area_sqm,
        "unit_level":     str(unit_level) if unit_level else "",
        "txn_year":       txn_year,
        "txn_month":      txn_month,
        # Derived columns needed by engineer_features
        "tenure_clean":   tenure.lower(),
        "is_freehold":    1 if "freehold" in tenure.lower() else 0,
        "log_price":      bundle["encoders"]["global_median"],  # placeholder
    }])

    row["unit_level_num"] = pd.to_numeric(
        row["unit_level"].str.extract(r"(\d+)")[0], errors="coerce"
    ).fillna(0).astype(int)
    row["is_high_rise"] = (row["unit_level_num"] > 0).astype(int)
    row["ym"] = f"{txn_year}-{str(txn_month).zfill(2)}"

    row, _ = engineer_features(row, fit_mode=False, encoders=bundle["encoders"])

    X = row[bundle["features"]]
    log_pred = bundle["model"].predict(X)[0]
    point    = math.exp(log_pred)
    low      = point * (1 - confidence_pct)
    high     = point * (1 + confidence_pct)

    return {
        "estimated_value_rm":  round(point, -3),   # round to nearest 1000
        "confidence_low_rm":   round(low, -3),
        "confidence_high_rm":  round(high, -3),
        "confidence_band_pct": confidence_pct * 100,
        "model_version":       bundle["version"],
    }

# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    bundle = train_pipeline(n_optuna_trials=60, run_shap=True)
    print("\nDone. Model bundle saved to ./models/")
