import { useState } from "react";
import PropertyCalculatorView from "../views/PropertyCalculatorView";

const getDefaultTransactionDate = () => {
  const now = new Date();

  return {
    txnYear: now.getFullYear().toString(),
    txnMonth: String(now.getMonth() + 1),
  };
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const PropertyCalculatorController = () => {
  const defaultTransactionDate = getDefaultTransactionDate();
  const strataPropertyTypes = new Set([
    "Condominium/Apartment",
    "Flat",
    "Low-Cost Flat",
  ]);

  const [formData, setFormData] = useState({
    propertyType: "",
    schemeName: "",
    district: "",
    mukim: "",
    floorAreaSqm: "",
    landAreaSqm: "",
    tenure: "Freehold",
    txnYear: defaultTransactionDate.txnYear,
    txnMonth: defaultTransactionDate.txnMonth,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [calculationResults, setCalculationResults] = useState(null);

  const getApiUrl = () => {
    const baseUrl = import.meta.env.VITE_PROPERTY_ESTIMATOR_API_URL;
    if (!baseUrl) {
      throw new Error(
        "Property estimator service is not configured. Please try again later.",
      );
    }
    return `${baseUrl.replace(/\/$/, "")}/estimate`;
  };

  const buildValidationErrors = () => {
    const nextErrors = {};
    const isStrataProperty = strataPropertyTypes.has(formData.propertyType);

    if (!formData.propertyType)
      nextErrors.propertyType = "Property Type is required";
    if (!formData.schemeName.trim())
      nextErrors.schemeName = "Scheme Name is required";
    if (!formData.district.trim()) nextErrors.district = "District is required";
    if (!formData.mukim.trim()) nextErrors.mukim = "Mukim is required";

    const floorAreaSqm = toNumber(formData.floorAreaSqm);
    const landAreaSqm = toNumber(formData.landAreaSqm);

    if (floorAreaSqm === null || floorAreaSqm <= 0) {
      nextErrors.floorAreaSqm = "Floor area must be greater than 0";
    }

    if (!isStrataProperty && (landAreaSqm === null || landAreaSqm <= 0)) {
      nextErrors.landAreaSqm = "Land area must be greater than 0";
    }

    if (isStrataProperty && landAreaSqm !== null && landAreaSqm < 0) {
      nextErrors.landAreaSqm = "Land area cannot be negative";
    }

    if (!formData.tenure) nextErrors.tenure = "Tenure is required";

    if (!formData.txnYear) nextErrors.txnYear = "Transaction year is required";
    if (!formData.txnMonth)
      nextErrors.txnMonth = "Transaction month is required";

    return nextErrors;
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Handle form submission and validation
   */
  const handleCalculate = async () => {
    const validationErrors = buildValidationErrors();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_type: formData.propertyType,
          scheme_name: formData.schemeName.trim(),
          district: formData.district.trim(),
          mukim: formData.mukim.trim(),
          floor_area_sqm: toNumber(formData.floorAreaSqm),
          land_area_sqm:
            toNumber(formData.landAreaSqm) ??
            (strataPropertyTypes.has(formData.propertyType) ? 0 : null),
          tenure: formData.tenure,
          txn_year: toNumber(formData.txnYear),
          txn_month: toNumber(formData.txnMonth),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        // FastAPI validation errors return detail as an array of field errors
        const detail = Array.isArray(result?.detail)
          ? result.detail
              .map((item) => item?.msg || JSON.stringify(item))
              .join("; ")
          : result?.detail;
        throw new Error(
          detail || result?.error || "Failed to estimate property value.",
        );
      }

      setCalculationResults(result);
    } catch (error) {
      console.error("Error estimating property value:", error);
      setErrors({
        submit:
          error.message ||
          "Failed to estimate property value. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle form reset
   */
  const handleReset = () => {
    setFormData({
      propertyType: "",
      schemeName: "",
      district: "",
      mukim: "",
      floorAreaSqm: "",
      landAreaSqm: "",
      tenure: "Freehold",
      txnYear: defaultTransactionDate.txnYear,
      txnMonth: defaultTransactionDate.txnMonth,
    });
    setErrors({});
    setCalculationResults(null);
  };

  return (
    <PropertyCalculatorView
      formData={formData}
      errors={errors}
      onInputChange={handleInputChange}
      onCalculate={handleCalculate}
      onReset={handleReset}
      isLoading={isLoading}
      calculationResults={calculationResults}
    />
  );
};

export default PropertyCalculatorController;
