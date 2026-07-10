// User Login Page
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../services/authService";
import { supabase } from "../../config/supabase";
import "./authLayout.css";
import logo from "../../assets/images/logo.png";
import bgImage from "../../assets/images/loginPageBg.jpg";
import leftArrow from "../../assets/icons/icon_arrowLeft.svg";
import PasswordInput from "../common/PasswordInput";

export default function UserLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
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
      const { user, error: signInError } = await signIn(
        formData.email,
        formData.password,
      );

      if (signInError) {
        if (signInError.message?.includes("Email not confirmed")) {
          setError(
            "Please verify your email before logging in. Check your inbox for the confirmation link.",
          );
        } else {
          setError(signInError.message || "Login failed");
        }
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

        const isStaffAccount = Boolean(adminData) || Boolean(supportData);

        if (isStaffAccount) {
          setError("Please use Staff Login for admin/support accounts");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        console.log("✅ User login successful");
        navigate("/application");
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
      <div className="switch-login-group">
        <Link to="/staff-login" className="switch-login-btn">
          Staff Login →
        </Link>
        <Link to="/provider-login" className="switch-login-btn">
          Provider Login →
        </Link>
      </div>

      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">User Login</h2>
            <p className="auth-description">Enter your email and password</p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
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
                  required
                  disabled={loading}
                />
              </div>

              <p className="eligibility-note">
                Click{" "}
                <Link to="/eligibility-check" className="register-account">
                  Here
                </Link>{" "}
                to Register Account
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
