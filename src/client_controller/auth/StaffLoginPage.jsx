// Staff Login Page (Admin & Customer Support)
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../services/authService";
import { supabase } from "../../config/supabase";
import "./authLayout.css";
import logo from "../../assets/images/logo.png";
import bgImage from "../../assets/images/loginPageBg.jpg";
import leftArrow from "../../assets/icons/icon_arrowLeft.svg";

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    staffId: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Staff login uses email (staffId is their email)
      const { user, error: signInError } = await signIn(
        formData.staffId,
        formData.password,
      );

      if (signInError) {
        setError(signInError.message || "Login failed");
        setLoading(false);
        return;
      }

      if (user) {
        const [adminResult, supportResult] = await Promise.allSettled([
          supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
          supabase
            .from("customer_supports")
            .select("id")
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        const adminData =
          adminResult.status === "fulfilled" ? adminResult.value.data : null;
        const supportData =
          supportResult.status === "fulfilled"
            ? supportResult.value.data
            : null;

        if (adminData) {
          console.log("✅ Staff login successful, role: admin");
          navigate("/admin/dashboard");
        } else if (supportData) {
          console.log("✅ Staff login successful, role: support");
          navigate("/support/dashboard");
        } else {
          setError("Please use User Login for customer accounts");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <button onClick={() => navigate("/")} className="back-button">
        <img src={leftArrow} alt="Back" />
      </button>
      <Link to="/login" className="switch-login-btn">
        User Login →
      </Link>

      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">Staff Login</h2>
            <p className="auth-description">Enter your email and password</p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Staff ID</label>
                <input
                  type="text"
                  name="staffId"
                  value={formData.staffId}
                  onChange={handleChange}
                  placeholder="Staff ID"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  disabled={loading}
                />
              </div>

              <p className="eligibility-note">
                Contact developer to get admin/customer support account
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
