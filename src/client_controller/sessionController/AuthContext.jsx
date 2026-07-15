// Auth Context Provider
// Manages authentication state globally

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChange } from "../../services/authService";
import { supabase } from "../../config/supabase";

const AuthContext = createContext({});

// Routine/informational auth logs - silenced in production, kept for local debugging
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

// Log the user out after this long with no mouse/keyboard/touch activity,
// regardless of Supabase's own token refresh cycle (which would otherwise
// keep a forgotten-but-open tab signed in indefinitely).
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

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
  // Tracks which user's data is currently loaded so repeated SIGNED_IN events
  // for the same user (tab refocus, multi-tab localStorage sync) don't
  // trigger a redundant admin/support DB lookup + timeout race.
  const currentUserIdRef = useRef(null);

  const buildUserProfile = (authUser) => ({
    id: authUser.id,
    email: authUser.email || authUser.user_metadata?.email || null,
    full_name:
      authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
    ic_number: authUser.user_metadata?.ic_number || null,
    phone: authUser.user_metadata?.phone || null,
  });

  const getMetadataRole = (authUser) =>
    authUser?.user_metadata?.role || authUser?.app_metadata?.role || null;

  const fetchUserData = async (authUser) => {
    currentUserIdRef.current = authUser?.id ?? null;

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
      devLog("🔍 Fetching user data for:", authUser.id);
      const metadataRole = getMetadataRole(authUser);

      if (
        metadataRole === "admin" ||
        metadataRole === "support" ||
        metadataRole === "provider"
      ) {
        setUserRole(metadataRole);
        localStorage.setItem("userRole", metadataRole);
        setApplicationStatus(null);
        localStorage.removeItem("applicationStatus");
        setUser({
          ...authUser,
          ...buildUserProfile(authUser),
          role: metadataRole,
        });
        devLog("✅ Staff role from auth metadata:", metadataRole);
        return;
      }

      const createTimeout = (label) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(label)), 3000),
        );

      const [adminResult, supportResult, providerResult] = await Promise.all([
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
        Promise.race([
          supabase
            .from("providers")
            .select("id, email, company_name, phone")
            .eq("id", authUser.id)
            .maybeSingle(),
          createTimeout("ProviderTimeout"),
        ]).catch((error) => {
          console.warn(
            "⚠️ Timeout or error fetching provider data:",
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
          : providerResult.data
            ? "provider"
            : null;

      if (staffRole) {
        setUserRole(staffRole);
        localStorage.setItem("userRole", staffRole);
        setApplicationStatus(null);
        localStorage.removeItem("applicationStatus");
        devLog(
          "✅ Staff data from database:",
          staffRole === "admin"
            ? adminResult.data
            : staffRole === "support"
              ? supportResult.data
              : providerResult.data,
        );
        setUser({
          ...authUser,
          ...buildUserProfile(authUser),
          role: staffRole,
        });
        return;
      }

      const profile = buildUserProfile(authUser);
      const role =
        metadataRole === "user"
          ? "user"
          : cachedRole === "admin" ||
              cachedRole === "support" ||
              cachedRole === "provider"
            ? cachedRole
            : "user";
      setUserRole(role);
      localStorage.setItem("userRole", role);
      setUser({ ...authUser, ...profile, role });
      devLog("✅ User profile from auth metadata:", profile);

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
            "auctioning",
            "terminated",
          ])
          .maybeSingle();

        const result = await Promise.race([appFetchPromise, appTimeout]).catch(
          (err) => {
            devLog("ℹ️ Timeout checking application status");
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
          devLog(
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
            devLog(
              "⚠️ Timeout - using cached application status:",
              cachedStatus,
            );
            setApplicationStatus(cachedStatus);
          } else {
            devLog(
              "⚠️ Keeping existing application status due to timeout",
            );
          }
        }
      }

      setUser({ ...authUser, ...profile, role });
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      // Fallback: set user with default role
      const cachedRole = localStorage.getItem("userRole") || "user";
      const cachedStatus =
        localStorage.getItem("applicationStatus") || "incomplete";
      setUserRole(cachedRole);
      setApplicationStatus(cachedStatus);
      setUser(
        authUser
          ? { ...authUser, ...buildUserProfile(authUser), role: cachedRole }
          : null,
      );
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
      if (event === "SIGNED_IN") {
        const incomingUserId = session?.user?.id ?? null;
        if (incomingUserId && incomingUserId === currentUserIdRef.current) {
          // Same user re-firing SIGNED_IN (tab refocus, multi-tab sync) -
          // data is already loaded, skip the admin/support lookup + timeouts
          devLog("ℹ️ SIGNED_IN for already-loaded user, skipping refetch");
        } else {
          await fetchUserData(session?.user ?? null);
        }
      } else if (event === "SIGNED_OUT") {
        await fetchUserData(null);
      } else if (event === "TOKEN_REFRESHED") {
        devLog("🔄 Token refreshed, keeping existing user data");
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, markActivity, { passive: true }),
    );

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_LIMIT_MS) {
        devLog("⏰ Signing out after 30 minutes of inactivity");
        supabase.auth.signOut();
      }
    }, 60 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, markActivity),
      );
      clearInterval(intervalId);
    };
  }, [user]);

  const value = {
    user,
    userRole,
    applicationStatus,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
