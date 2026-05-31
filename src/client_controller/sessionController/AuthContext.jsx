// Auth Context Provider
// Manages authentication state globally

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChange } from "../../services/authService";
import { supabase } from "../../config/supabase";

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(() => {
    // Initialize from localStorage cache
    return localStorage.getItem("userRole") || null;
  });
  const [applicationStatus, setApplicationStatus] = useState(() => {
    // Initialize from localStorage cache
    return localStorage.getItem("applicationStatus") || null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setUserRole(null);
      setApplicationStatus(null);
      // Clear cache on logout
      localStorage.removeItem("userRole");
      localStorage.removeItem("applicationStatus");
      return;
    }

    try {
      console.log("🔍 Fetching user data for:", authUser.id);

      const createTimeout = (label) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(label)), 3000),
        );

      const [adminResult, supportResult] = await Promise.all([
        Promise.race([
          supabase
            .from("admins")
            .select("id, email, full_name, phone")
            .eq("id", authUser.id)
            .maybeSingle(),
          createTimeout("AdminTimeout"),
        ]).catch((error) => {
          console.warn(
            "⚠️ Timeout or error fetching admin data:",
            error.message,
          );
          return { data: null, error };
        }),
        Promise.race([
          supabase
            .from("customer_supports")
            .select("id, email, full_name, phone")
            .eq("id", authUser.id)
            .maybeSingle(),
          createTimeout("SupportTimeout"),
        ]).catch((error) => {
          console.warn(
            "⚠️ Timeout or error fetching customer support data:",
            error.message,
          );
          return { data: null, error };
        }),
      ]);

      const cachedRole = localStorage.getItem("userRole");
      const staffRole = adminResult.data
        ? "admin"
        : supportResult.data
          ? "support"
          : null;

      if (staffRole) {
        setUserRole(staffRole);
        localStorage.setItem("userRole", staffRole);
        setApplicationStatus(null);
        localStorage.removeItem("applicationStatus");
        console.log(
          "✅ Staff data from database:",
          staffRole === "admin" ? adminResult.data : supportResult.data,
        );
        setUser(authUser);
        return;
      }

      // Fetch customer user data from the users table with timeout (reduced to 3s)
      const userTimeout = createTimeout("UserTimeout");
      const fetchPromise = supabase
        .from("users")
        .select("id, email, full_name, ic_number, phone")
        .eq("id", authUser.id)
        .maybeSingle();

      const { data: userData } = await Promise.race([
        fetchPromise,
        userTimeout,
      ]).catch((error) => {
        console.warn("⚠️ Timeout or error fetching user data:", error.message);
        // Don't set default values on timeout - keep trying
        return { data: null, error: error };
      });

      // Determine role: use database data, then cache, then default to 'user'
      const role = userData ? "user" : cachedRole || "user";
      setUserRole(role);

      // Only update cache if we got fresh data from database
      if (userData) {
        localStorage.setItem("userRole", role);
        console.log("✅ User data from database:", userData);
      } else if (cachedRole) {
        console.log("📦 Using cached role:", cachedRole);
      } else {
        console.warn(
          "⚠️ User not found in database and no cache, defaulting to user role",
        );
      }

      if (!userData && !cachedRole) {
        console.warn("⚠️ No user data and no cache available");
      } else {
        console.log("✅ User data:", userData, "- Role:", role);
      }

      // Check if user has completed application (for 'user' role) - with timeout
      if (role === "user") {
        const appTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AppTimeout")), 3000),
        );

        const appFetchPromise = supabase
          .from("applications")
          .select("status")
          .eq("user_id", authUser.id)
          .in("status", [
            "submitted",
            "underReviewed",
            "approved",
            "terminated",
          ])
          .maybeSingle();

        const result = await Promise.race([appFetchPromise, appTimeout]).catch(
          (err) => {
            console.log("ℹ️ Timeout checking application status");
            return { data: null, error: err, timedOut: true };
          },
        );

        // Only update status if query succeeded (not timed out)
        if (!result.timedOut) {
          // Track terminated status separately so route protection can block new applications
          let appStatus = "incomplete";
          if (result.data) {
            appStatus =
              result.data.status === "terminated" ? "terminated" : "complete";
          }
          console.log(
            "📊 Application status:",
            appStatus,
            "- App data:",
            result.data,
          );
          setApplicationStatus(appStatus);
          // Cache the application status in localStorage
          localStorage.setItem("applicationStatus", appStatus);
        } else {
          // Use cached status on timeout
          const cachedStatus = localStorage.getItem("applicationStatus");
          if (cachedStatus) {
            console.log(
              "⚠️ Timeout - using cached application status:",
              cachedStatus,
            );
            setApplicationStatus(cachedStatus);
          } else {
            console.log(
              "⚠️ Keeping existing application status due to timeout",
            );
          }
        }
      }

      setUser(authUser);
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      // Fallback: set user with default role
      const cachedRole = localStorage.getItem("userRole") || "user";
      const cachedStatus =
        localStorage.getItem("applicationStatus") || "incomplete";
      setUserRole(cachedRole);
      setApplicationStatus(cachedStatus);
      setUser(authUser);
      // Keep userRole as null to indicate data fetch failure
      console.warn("⚠️ User role could not be determined due to error");
    }
  };

  useEffect(() => {
    // Check current session on mount
    const initAuth = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        await fetchUserData(authUser);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = onAuthStateChange(async (event, session) => {
      // Only fetch full user data on SIGNED_IN or SIGNED_OUT events
      // Don't refetch on TOKEN_REFRESHED to avoid unnecessary queries
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        await fetchUserData(session?.user ?? null);
      } else if (event === "TOKEN_REFRESHED") {
        console.log("🔄 Token refreshed, keeping existing user data");
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userRole,
    applicationStatus,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
