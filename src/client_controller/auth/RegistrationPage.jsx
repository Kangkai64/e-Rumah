// Customer Registration Page
import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { signUp } from "../../services/authService";
import {
  validateRequired,
  validateIC,
  validateICNotPR,
  validateEmail,
  validatePhone,
} from "../../utils/applicationValidation";
import { formatICInput, getICCursorPosition } from "../../utils/icParser";
import "./authLayout.css";
import logo from "../../assets/images/logo.png";
import bgImage from "../../assets/images/loginPageBg.jpg";
import leftArrow from "../../assets/icons/icon_arrowLeft.svg";
import { useToast } from "../common/ToastContext";

const NAME_PATTERN = /^[A-Za-z\s'-]+$/;
const SPECIAL_CHAR_PATTERN = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~\\]/;

// Individual password requirement checks, reused by validation and the
// live requirements checklist shown under the password field
const getPasswordRequirements = (password) => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: SPECIAL_CHAR_PATTERN.test(password),
});

// Field-level validation, mirroring the pattern used in applicationValidation.js
const validateField = (name, formData) => {
  switch (name) {
    case "fullName": {
      const requiredError = validateRequired(formData.fullName, "Full Name");
      if (requiredError) return requiredError;
      if (formData.fullName.trim().length < 2)
        return "Full Name must be at least 2 characters";
      if (!NAME_PATTERN.test(formData.fullName))
        return "Full Name must only contain letters, spaces, hyphens and apostrophes";
      return null;
    }
    case "icNumber": {
      const formatError = validateIC(formData.icNumber);
      if (formatError) return formatError;
      return validateICNotPR(formData.icNumber);
    }
    case "phone": {
      const requiredError = validateRequired(formData.phone, "Phone Number");
      if (requiredError) return requiredError;
      return validatePhone(formData.phone);
    }
    case "email":
      return validateEmail(formData.email);
    case "confirmEmail": {
      const requiredError = validateRequired(
        formData.confirmEmail,
        "Confirm Email",
      );
      if (requiredError) return requiredError;
      if (formData.confirmEmail !== formData.email)
        return "Emails do not match";
      return null;
    }
    case "password": {
      const requiredError = validateRequired(formData.password, "Password");
      if (requiredError) return requiredError;

      const requirements = getPasswordRequirements(formData.password);
      if (!requirements.length) return "Password must be at least 8 characters";
      if (!requirements.uppercase)
        return "Password must contain at least one uppercase letter";
      if (!requirements.lowercase)
        return "Password must contain at least one lowercase letter";
      if (!requirements.number)
        return "Password must contain at least one number";
      if (!requirements.special)
        return "Password must contain at least one special character";

      // Reject trivially guessable passwords built from the user's own details
      const lowerPassword = formData.password.toLowerCase();
      const emailLocalPart = (formData.email || "")
        .split("@")[0]
        ?.toLowerCase();
      const nameParts = (formData.fullName || "")
        .toLowerCase()
        .split(/\s+/)
        .filter((part) => part.length >= 3);
      if (emailLocalPart && lowerPassword.includes(emailLocalPart))
        return "Password must not contain your email address";
      if (nameParts.some((part) => lowerPassword.includes(part)))
        return "Password must not contain your name";

      return null;
    }
    case "confirmPassword": {
      const requiredError = validateRequired(
        formData.confirmPassword,
        "Confirm Password",
      );
      if (requiredError) return requiredError;
      if (formData.confirmPassword !== formData.password)
        return "Passwords do not match";
      return null;
    }
    default:
      return null;
  }
};

// Checks the email against existing accounts, normalizing Gmail's dot and
// plus-alias tricks server-side so e.g. ad.am@gmail.com is caught as a
// duplicate of an existing adam@gmail.com registration.
const checkDuplicateEmail = async (email) => {
  const { data, error } = await supabase.rpc("check_duplicate_email", {
    email_to_check: email,
  });
  if (error) {
    console.error("Duplicate email check failed:", error);
    return null;
  }
  return data ? "This email is already registered" : null;
};

const checkDuplicateIC = async (icNumber) => {
  const { data, error } = await supabase.rpc("check_duplicate_ic", {
    nric_to_check: icNumber,
  });
  if (error) {
    console.error("Duplicate IC check failed:", error);
    return null;
  }
  return data ? "This IC number is already registered" : null;
};

const FIELD_NAMES = [
  "fullName",
  "icNumber",
  "phone",
  "email",
  "confirmEmail",
  "password",
  "confirmPassword",
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const icInputRef = useRef(null);
  const [formData, setFormData] = useState({
    fullName: "",
    icNumber: "",
    phone: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRequirements = getPasswordRequirements(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    if (name === "icNumber") {
      const digitsBeforeCursor = value
        .slice(0, e.target.selectionStart)
        .replace(/\D/g, "").length;
      const formatted = formatICInput(value);

      setFormData((prev) => ({ ...prev, icNumber: formatted }));

      requestAnimationFrame(() => {
        const input = icInputRef.current;
        if (!input) return;
        const caret = getICCursorPosition(formatted, digitsBeforeCursor);
        input.setSelectionRange(caret, caret);
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = async (e) => {
    const { name } = e.target;
    const fieldError = validateField(name, formData);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    if (fieldError) return;

    if (name === "email") {
      const dupError = await checkDuplicateEmail(formData.email);
      setErrors((prev) => ({ ...prev, email: dupError }));
    } else if (name === "icNumber") {
      const dupError = await checkDuplicateIC(formData.icNumber);
      setErrors((prev) => ({ ...prev, icNumber: dupError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const newErrors = {};
    FIELD_NAMES.forEach((name) => {
      const fieldError = validateField(name, formData);
      if (fieldError) newErrors[name] = fieldError;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("Please fix the errors below");
      return;
    }

    setLoading(true);

    // Final duplicate guard in case the field was never blurred (e.g.
    // browser autofill) before submit.
    const [emailDupError, icDupError] = await Promise.all([
      checkDuplicateEmail(formData.email),
      checkDuplicateIC(formData.icNumber),
    ]);
    if (emailDupError || icDupError) {
      setErrors((prev) => ({
        ...prev,
        ...(emailDupError && { email: emailDupError }),
        ...(icDupError && { icNumber: icDupError }),
      }));
      setError("Please fix the errors below");
      setLoading(false);
      return;
    }

    try {
      const { user, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName.trim(),
        ic_number: formData.icNumber,
        phone: formData.phone,
      });

      if (error) {
        setError(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      if (user) {
        console.log("✅ Signup successful");
        showToast("Account created successfully!", "success");
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <button onClick={() => navigate("/")} className="back-button">
        <img src={leftArrow} alt="Back" />
      </button>

      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">Customer Registration</h2>
            <p className="auth-description">
              Enter your details to create your account
            </p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your full name"
                  className={errors.fullName ? "error" : ""}
                  disabled={loading}
                />
                {errors.fullName && (
                  <span className="error-message">{errors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label>IC Number *</label>
                <input
                  ref={icInputRef}
                  type="text"
                  name="icNumber"
                  value={formData.icNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="YYMMDD-PB-###G"
                  className={errors.icNumber ? "error" : ""}
                  disabled={loading}
                  maxLength={14}
                />
                {errors.icNumber && (
                  <span className="error-message">{errors.icNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="01X-XXXXXXX"
                  className={errors.phone ? "error" : ""}
                  disabled={loading}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  className={errors.email ? "error" : ""}
                  disabled={loading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Email *</label>
                <input
                  type="email"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your email"
                  className={errors.confirmEmail ? "error" : ""}
                  disabled={loading}
                />
                {errors.confirmEmail && (
                  <span className="error-message">{errors.confirmEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className={errors.password ? "error" : ""}
                  disabled={loading}
                />
                <p className="password-hint">
                  At least 8 characters, mixing case, numbers &amp; symbols
                </p>
                {formData.password && (
                  <ul className="password-requirements">
                    {[
                      ["length", "At least 8 characters"],
                      ["uppercase", "One uppercase letter"],
                      ["lowercase", "One lowercase letter"],
                      ["number", "One number"],
                      ["special", "One special character"],
                    ].map(([key, label]) => (
                      <li
                        key={key}
                        className={passwordRequirements[key] ? "met" : "unmet"}
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Re-enter your password"
                  className={errors.confirmPassword ? "error" : ""}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <span className="error-message">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="auth-footer-text">
                <p>
                  You have an account? <Link to="/login">Login</Link>
                </p>
              </div>

              <button
                type="submit"
                className="auth-btn primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Submit"}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-image-side">
          <img src={bgImage} alt="Background" className="auth-bg-image" />
          <div className="auth-overlay">
            <h1>Welcome to e-Rumah</h1>
            <p>
              Enabling retired home owners to gain access to a lifetime of
              supplemental income stream for daily subsistence to cater to
              potential increases in the cost of living.
            </p>
          </div>
          <div className="auth-copyright">© Copyright 2025 e-Rumah</div>
        </div>
      </div>
    </div>
  );
}
