// Provider Login Page (Reverse Mortgage Providers)
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../services/authService";
import { supabase } from "../../config/supabase";
import "./authLayout.css";
import logo from "../../assets/images/logo.png";
import bgImage from "../../assets/images/loginPageBg.jpg";
import leftArrow from "../../assets/icons/icon_arrowLeft.svg";
import PasswordInput from "../common/PasswordInput";

export default function ProviderLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    providerId: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const fetchProviderProfile = async (user) => {
    const queries = [
      supabase.from("providers").select("id, email").eq("id", user.id).maybeSingle(),
    ];

    if (user.email) {
      queries.push(
        supabase
          .from("providers")
          .select("id, email")
          .eq("email", user.email)
          .maybeSingle(),
      );
    }

    const results = await Promise.allSettled(queries);

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.data) {
        return result.value.data;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.providerId.trim() || !formData.password) {
      setError("Please enter your email and password");
      return;
    }

    setLoading(true);

    try {
      const { user, error: signInError } = await signIn(
        formData.providerId,
        formData.password,
      );

      if (signInError) {
        setError(signInError.message || "Login failed");
        setLoading(false);
        return;
      }

      if (user) {
        const providerData = await fetchProviderProfile(user);

        if (providerData) {
          await supabase.auth.updateUser({ data: { role: "provider" } });
          navigate("/provider/dashboard");
        } else {
          setError("This account is not registered as a provider");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Provider login error:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <button onClick={() => navigate("/")} className="back-button">
        <img src={leftArrow} alt="Back" />
      </button>
      <div className="switch-login-group">
        <Link to="/login" className="switch-login-btn">
          User Login →
        </Link>
        <Link to="/staff-login" className="switch-login-btn">
          Staff Login →
        </Link>
      </div>

      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">Provider Login</h2>
            <p className="auth-description">
              Reverse mortgage provider portal - enter your email and password
            </p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label>Provider Email</label>
                <input
                  type="text"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  placeholder="Provider Email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  disabled={loading}
                />
              </div>

              <p className="eligibility-note">
                Contact e-Rumah to register your organization as a provider
              </p>

              <div className="form-buttons">
                <button
                  type="submit"
                  className="auth-btn primary"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
                <Link to="/" className="auth-btn secondary">
                  Home
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="auth-image-side">
          <img src={bgImage} alt="Background" className="auth-bg-image" />
          <div className="auth-overlay">
            <h1>e-Rumah Provider Portal</h1>
            <p>
              Review applications open for bidding and submit competing
              reverse mortgage offers to eligible applicants.
            </p>
          </div>
          <div className="auth-copyright">© Copyright 2025 e-Rumah</div>
        </div>
      </div>
    </div>
  );
}
