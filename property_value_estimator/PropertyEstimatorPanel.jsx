import React, { useCallback, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_ESTIMATOR_API_URL ?? "http://localhost:8000";

const PROPERTY_TYPE_OPTIONS = [
  "Terrace House",
  "Semi-Detached House",
  "Detached House",
  "Bungalow",
  "Apartment",
  "Condominium",
  "Flat",
  "Townhouse",
  "Service Residence",
  "Cluster House",
];

const TENURE_OPTIONS = ["Freehold", "Leasehold"];

const QUARTER_OPTIONS = [
  { value: 1, label: "Q1" },
  { value: 2, label: "Q2" },
  { value: 3, label: "Q3" },
  { value: 4, label: "Q4" },
];

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getCurrentQuarter(monthNumber) {
  return Math.ceil(monthNumber / 3);
}

const now = new Date();

const defaultForm = {
  property_type: "Terrace House",
  district: "",
  mukim: "",
  floor_area_sqm: "",
  land_area_sqm: "",
  tenure: "Freehold",
  unit_level: "",
  txn_year: String(now.getFullYear()),
  txn_quarter: String(getCurrentQuarter(now.getMonth() + 1)),
  txn_month: String(now.getMonth() + 1),
};

/**
 * Custom hook that calls the Python estimator backend.
 */
export function usePropertyEstimator() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const estimate = useCallback(async (propertyData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { estimate, result, loading, error };
}

function formatMYR(value) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({ label, value, accent = false }) {
  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 16,
        border: `1px solid ${accent ? "rgba(168, 32, 45, 0.22)" : "#E7E3E3"}`,
        background: accent ? "linear-gradient(180deg, #FFF8F8 0%, #FFFFFF 100%)" : "#FFFFFF",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#777778", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: accent ? 28 : 18, fontWeight: 700, color: accent ? "#A8202D" : "#161519" }}>
        {value}
      </div>
    </div>
  );
}

function Field({ label, children, hint = null, required = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#161519" }}>
        {label}{required ? <span style={{ color: "#A8202D" }}> *</span> : null}
      </span>
      {children}
      {hint ? <span style={{ fontSize: 12, color: "#777778", lineHeight: 1.45 }}>{hint}</span> : null}
    </label>
  );
}

const controlStyle = {
  width: "100%",
  border: "1px solid #CFC9C9",
  borderRadius: 12,
  padding: "0.85rem 1rem",
  backgroundColor: "#FFFFFF",
  color: "#161519",
  fontSize: 15,
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  boxShadow: "0 1px 0 rgba(22, 21, 25, 0.02)",
};

const buttonStyle = {
  border: "none",
  borderRadius: 12,
  padding: "0.95rem 1.4rem",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
};

export default function PropertyEstimatorPanel() {
  const [form, setForm] = useState(defaultForm);
  const { estimate, result, loading, error } = usePropertyEstimator();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const payload = useMemo(() => {
    const nextPayload = {
      property_type: form.property_type.trim(),
      district: form.district.trim(),
      mukim: form.mukim.trim(),
      floor_area_sqm: Number(form.floor_area_sqm),
      land_area_sqm: Number(form.land_area_sqm),
      tenure: form.tenure,
      txn_year: Number(form.txn_year),
      txn_quarter: Number(form.txn_quarter),
      txn_month: Number(form.txn_month),
    };

    if (form.unit_level.trim() !== "") {
      nextPayload.unit_level = Number(form.unit_level);
    }

    return nextPayload;
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await estimate(payload).catch(() => {});
  };

  const currentMonthLabel = MONTH_OPTIONS.find((option) => option.value === Number(form.txn_month))?.label ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2.5rem 1rem",
        background: "linear-gradient(180deg, #FBFAFA 0%, #F5F5F5 54%, #EFECEC 100%)",
        color: "#161519",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "rgba(255, 255, 255, 0.94)",
              border: "1px solid #E5E0E0",
              borderRadius: 24,
              boxShadow: "0 18px 50px rgba(22, 21, 25, 0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "1.5rem 1.5rem 1.25rem", borderBottom: "1px solid #EEE8E8" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: "#A8202D" }} />
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#777778", textTransform: "uppercase" }}>
                  Property Value Estimator
                </span>
              </div>
              <h2 style={{ fontSize: 28, lineHeight: 1.15, margin: 0, color: "#161519" }}>
                Automated valuation aligned with the NAPIC model inputs.
              </h2>
              <p style={{ marginTop: 10, color: "#5F5F60", lineHeight: 1.6, maxWidth: 720 }}>
                Provide the latest transaction features required by the estimator backend to get a reference value, confidence band, and model metadata.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 18,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field
                    label="Property Type"
                    required
                    hint="Use the same wording as the transaction record where possible."
                  >
                    <input
                      list="property-type-options"
                      name="property_type"
                      value={form.property_type}
                      onChange={handleChange}
                      placeholder="e.g. 1 - 1 1/2 Storey Semi-Detached"
                      required
                      style={controlStyle}
                    />
                    <datalist id="property-type-options">
                      {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </Field>
                </div>

                <Field label="District" required>
                  <input
                    type="text"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    placeholder="e.g. Alor Gajah"
                    required
                    style={controlStyle}
                  />
                </Field>

                <Field label="Mukim" required>
                  <input
                    type="text"
                    name="mukim"
                    value={form.mukim}
                    onChange={handleChange}
                    placeholder="e.g. Bdr Masjid Tanah"
                    required
                    style={controlStyle}
                  />
                </Field>

                <Field label="Floor Area (sqm)" required>
                  <input
                    type="number"
                    name="floor_area_sqm"
                    value={form.floor_area_sqm}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 106"
                    required
                    style={controlStyle}
                  />
                </Field>

                <Field label="Land Area (sqm)" required>
                  <input
                    type="number"
                    name="land_area_sqm"
                    value={form.land_area_sqm}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 374"
                    required
                    style={controlStyle}
                  />
                </Field>

                <Field label="Tenure" required>
                  <select name="tenure" value={form.tenure} onChange={handleChange} required style={controlStyle}>
                    {TENURE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Unit Level"
                  hint="Optional. Leave blank for ground level or if the source data does not specify a level."
                >
                  <input
                    type="number"
                    name="unit_level"
                    value={form.unit_level}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    style={controlStyle}
                  />
                </Field>

                <Field label="Transaction Year" required>
                  <input
                    type="number"
                    name="txn_year"
                    value={form.txn_year}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                    required
                    style={controlStyle}
                  />
                </Field>

                <Field label="Transaction Quarter" required>
                  <select name="txn_quarter" value={form.txn_quarter} onChange={handleChange} required style={controlStyle}>
                    {QUARTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Transaction Month" required>
                  <select name="txn_month" value={form.txn_month} onChange={handleChange} required style={controlStyle}>
                    {MONTH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...buttonStyle,
                    background: loading ? "#B8A7AA" : "linear-gradient(135deg, #A8202D 0%, #8E1A25 100%)",
                    color: "#FFFFFF",
                    boxShadow: loading ? "none" : "0 12px 26px rgba(168, 32, 45, 0.22)",
                  }}
                  onMouseEnter={(event) => {
                    if (!loading) {
                      event.currentTarget.style.transform = "translateY(-1px)";
                      event.currentTarget.style.boxShadow = "0 16px 30px rgba(168, 32, 45, 0.26)";
                    }
                  }}
                  onMouseLeave={(event) => {
                    if (!loading) {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.style.boxShadow = "0 12px 26px rgba(168, 32, 45, 0.22)";
                    }
                  }}
                >
                  {loading ? "Estimating..." : "Estimate Property Value"}
                </button>

                <div style={{ fontSize: 13, color: "#777778", lineHeight: 1.5 }}>
                  Month selected: {currentMonthLabel} · backend expects the latest schema from the estimator README.
                </div>
              </div>

              {error ? (
                <div
                  style={{
                    marginTop: 20,
                    padding: "1rem 1.1rem",
                    borderRadius: 16,
                    border: "1px solid #F0B4BA",
                    background: "#FFF5F6",
                    color: "#8F1A28",
                    lineHeight: 1.55,
                  }}
                >
                  <strong>Estimation failed.</strong> {error}
                </div>
              ) : null}
            </form>
          </section>

          <aside
            style={{
              position: "sticky",
              top: 24,
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, #A8202D 0%, #8F1A28 100%)",
                color: "#FFFFFF",
                borderRadius: 24,
                padding: "1.4rem",
                boxShadow: "0 18px 42px rgba(168, 32, 45, 0.24)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.88 }}>
                Reference estimate
              </div>
              <p style={{ margin: "0.7rem 0 0", lineHeight: 1.65, color: "rgba(255, 255, 255, 0.92)" }}>
                The result is a machine-learning estimate for onboarding support only. It does not replace a formal valuation.
              </p>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E0E0",
                borderRadius: 24,
                padding: 16,
                boxShadow: "0 12px 30px rgba(22, 21, 25, 0.06)",
              }}
            >
              {result ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <StatCard label="Estimated Price" value={formatMYR(result.estimated_price_rm)} accent />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                    <StatCard label="Lower Bound" value={formatMYR(result.lower_bound_rm)} />
                    <StatCard label="Upper Bound" value={formatMYR(result.upper_bound_rm)} />
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      borderTop: "1px solid #EEE8E8",
                      paddingTop: 14,
                      display: "grid",
                      gap: 8,
                      color: "#5F5F60",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <div><strong style={{ color: "#161519" }}>Model:</strong> {result.model_used}</div>
                    <div><strong style={{ color: "#161519" }}>Currency:</strong> {result.currency}</div>
                    <div style={{ color: "#777778", fontSize: 13 }}>{result.disclaimer}</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1rem 0.5rem 0.5rem", color: "#5F5F60", lineHeight: 1.7 }}>
                  Fill in the transaction details and run the estimate to see the valuation, bounds, and model output here.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
