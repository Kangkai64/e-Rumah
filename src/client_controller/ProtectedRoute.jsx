// Protected Route Component
// Redirects based on user authentication and application status

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./sessionController/AuthContext";

// Central place to decide where a given role belongs, so unmatched/forbidden
// routes always send users back to their own dashboard instead of a blank page.
// eslint-disable-next-line react-refresh/only-export-components
export function getRoleHomePath(role, applicationStatus) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "support") return "/support/dashboard";
  if (role === "provider") return "/provider/dashboard";
  if (role === "user") {
    return applicationStatus === "incomplete" ? "/application" : "/user/dashboard";
  }
  return "/login";
}

// Catches any path that isn't declared as a <Route> (e.g. a support user
// typing /admin instead of /admin/dashboard) and sends them to their own home page.
export function NotFoundRedirect() {
  const { user, userRole, applicationStatus, loading } = useAuth();
  const role = user?.role ?? userRole ?? null;

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(role, applicationStatus)} replace />;
}

export default function ProtectedRoute({ children, requireRole = null }) {
  const { user, userRole, applicationStatus, loading } = useAuth();
  const location = useLocation();
  const role = user?.role ?? userRole ?? null;

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Wait for the role to be determined before making routing decisions
  // This prevents premature redirects while role is being fetched
  if (role === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="loading-spinner"></div>
        <p>Determining access...</p>
      </div>
    );
  }

  // For regular users, also wait for applicationStatus to be determined
  if (role === "user" && applicationStatus === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div className="loading-spinner"></div>
        <p>Determining access...</p>
      </div>
    );
  }

  // Role-based access control - only redirect if role doesn't match requirement
  if (requireRole && role !== requireRole) {
    console.log(`🚫 Access denied. Required: ${requireRole}, Current: ${role}`);
    return <Navigate to={getRoleHomePath(role, applicationStatus)} replace />;
  }

  // For terminated users - block access to /application (they cannot apply again until paid)
  if (
    role === "user" &&
    applicationStatus === "terminated" &&
    location.pathname === "/application"
  ) {
    console.log("🚫 Terminated user cannot access application form");
    return <Navigate to="/user/application" replace />;
  }

  // For regular users with incomplete application (only check for 'user' role)
  if (role === "user" && applicationStatus === "incomplete") {
    // Only allow access to /application route and landing pages
    if (
      !location.pathname.startsWith("/application") &&
      location.pathname !== "/" &&
      location.pathname !== "/about"
    ) {
      return <Navigate to="/application" replace />;
    }
  }

  // For regular users with complete or terminated application trying to access /application
  if (
    role === "user" &&
    (applicationStatus === "complete" || applicationStatus === "terminated") &&
    location.pathname === "/application"
  ) {
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}
