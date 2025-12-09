// import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "@/lib/api-config";

// export type User = { id: string; email: string; name: string; username: string; contact_number: string } | null;

// interface AuthContextValue {
//   user: User;
//   loading: boolean;
//   signup: (
//     name: string,
//     username: string,
//     email: string,
//     password: string,
//     contact_number: string,
//     permanent_address: string,
//     country: string,
//     city: string,
//     contact_number_2?: string
//   ) => Promise<void>;
//   login: (login: string, password: string) => Promise<void>;
//   logout: () => void;
//   refreshUser: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// const LS_USER_KEY = "rangista_user";
// const LS_TOKEN_KEY = "token";
// const API_BASE = API_BASE_URL; // FastAPI backend URL

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User>(null);
//   const [loading, setLoading] = useState(true);

//   // Check for token, clean localStorage, and attempt to log in on mount
//   useEffect(() => {
//     // Clean localStorage: remove all keys except 'rangista_favorites' and 'token'
//     Object.keys(localStorage).forEach((key) => {
//       if (key !== "rangista_favorites" && key !== LS_TOKEN_KEY) {
//         console.log(`🗑️ Removing unauthorized localStorage key: ${key}`);
//         localStorage.removeItem(key);
//       }
//     });

//     const token = localStorage.getItem(LS_TOKEN_KEY);
//     if (token) {
//       console.log("✅ Found token in localStorage, attempting to fetch user...");
//       axios
//         .get(`${API_BASE}/users/me`, {
//           headers: { Authorization: `Bearer ${token}` },
//         })
//         .then((response) => {
//           const userData = response.data;
//           console.log("✅ Fetched user data:", userData);
//           sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
//           setUser(userData);
//         })
//         .catch((error) => {
//           console.log("⚠️ Token-based login failed:", error.response?.data || error.message);
//           localStorage.removeItem(LS_TOKEN_KEY); // Remove invalid token
//           sessionStorage.removeItem(LS_USER_KEY); // Clear user data
//         })
//         .finally(() => {
//           setLoading(false);
//           console.log("⏳ Loading set to false");
//         });
//     } else {
//       // Check sessionStorage for user data if no token is found
//       const raw = sessionStorage.getItem(LS_USER_KEY);
//       if (raw) {
//         const parsedUser = JSON.parse(raw);
//         console.log("✅ Parsed user object from sessionStorage:", parsedUser);
//         setUser(parsedUser);
//       } else {
//         console.log("⚠️ No token or user found");
//       }
//       setLoading(false);
//       console.log("⏳ Loading set to false");
//     }
//   }, []);

//   // Signup function
//   const signup = async (
//     name: string,
//     username: string,
//     email: string,
//     password: string,
//     contact_number: string,
//     permanent_address: string,
//     country: string,
//     city: string,
//     contact_number_2?: string
//   ) => {
//     try {
//       console.log("Signup payload:", {
//         name,
//         username,
//         email,
//         password,
//         contact_number,
//         permanent_address,
//         country,
//         city,
//         contact_number_2,
//       });
//       const response = await axios.post(`${API_BASE}/signup`, {
//         name,
//         username,
//         email,
//         password,
//         contact_number,
//         permanent_address,
//         country,
//         city,
//         contact_number_2,
//       });
//       const userData = response.data; // backend returns UserResponse
//       sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
//       setUser(userData);
//     } catch (error: any) {
//       console.log("Signup error:", error.response?.data);
//       throw new Error(error.response?.data?.detail || "Signup failed");
//     }
//   };

//   // Login function
//   const login = async (login: string, password: string) => {
//     try {
//       const formData = new URLSearchParams();
//       formData.append("username", login); // Backend accepts username, email, or contact_number
//       formData.append("password", password);

//       const response = await axios.post(`${API_BASE}/signin`, formData, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });

//       const token = response.data.access_token;
//       localStorage.setItem(LS_TOKEN_KEY, token);

//       // Fetch current user info
//       const userResp = await axios.get(`${API_BASE}/users/me`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const userData = userResp.data;
//       sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
//       setUser(userData);
//     } catch (error: any) {
//       throw new Error(error.response?.data?.detail || "Login failed");
//     }
//   };

//   // Logout function
//   const logout = () => {
//     sessionStorage.removeItem(LS_USER_KEY);
//     localStorage.removeItem(LS_TOKEN_KEY);
//     setUser(null);
//   };

//   // Refresh user from server using stored token
//   const refreshUser = async () => {
//     const token = localStorage.getItem(LS_TOKEN_KEY);
//     if (!token) throw new Error("Missing auth token");
//     const userResp = await axios.get(`${API_BASE}/users/me`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const userData = userResp.data;
//     sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userData));
//     setUser(userData);
//   };

//   const value = useMemo(
//     () => ({ user, loading, signup, login, logout, refreshUser }),
//     [user, loading]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// // Hook to use Auth context
// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }





















import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api-config";
import {
  createClient,
  SupabaseClient,
  Session,
  User as SupabaseUser,
} from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export type User = {
  id: string;
  email: string;
  name?: string | null;
  username?: string;
  contact_number?: string | null;
  permanent_address?: string | null;
  country?: string | null;
  city?: string | null;
} | null;

interface AuthContextValue {
  user: User;
  loading: boolean;
  signup: (
    name: string,
    username: string,
    email: string,
    password: string,
    contact_number: string,
    permanent_address: string,
    country: string,
    city: string,
    contact_number_2?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  supabaseClient: SupabaseClient;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_USER_KEY = "rangista_user";
const LS_TOKEN_KEY = "token";
const API_BASE = API_BASE_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  /** ------------------------------------------------------
   *  INITIAL LOAD — RESTORE SESSION SAFELY
   * ------------------------------------------------------ */
  useEffect(() => {
    const restore = async () => {
      try {
        // 1) Restore Supabase session
        const { data } = await supabase.auth.getSession();
        const session: Session | null = data.session;

        if (session?.access_token) {
          localStorage.setItem(LS_TOKEN_KEY, session.access_token);

          // 2) Get backend profile
          const uid = session.user?.id;
          if (uid) {
            const resp = await axios.get(`${API_BASE}/users/${uid}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });

            setUser(resp.data);
            localStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
          }
        } else {
          // No supabase session — restore user from localStorage
          const raw = localStorage.getItem(LS_USER_KEY);
          if (raw) setUser(JSON.parse(raw));
        }
      } catch (err) {
        console.error("Restore session failed:", err);
      } finally {
        setLoading(false);
      }
    };

    restore();

    /** ------------------------------------------------------
     *  LISTEN TO AUTH CHANGES
     * ------------------------------------------------------ */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          localStorage.setItem(LS_TOKEN_KEY, session.access_token);

          const uid = session.user?.id;
          if (uid) {
            axios
              .get(`${API_BASE}/users/${uid}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
              .then((resp) => {
                setUser(resp.data);
                localStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
              })
              .catch(() => {
                setUser({
                  id: uid,
                  email: session.user.email ?? "",
                });
              });
          }
        } else {
          // Logged out
          localStorage.removeItem(LS_TOKEN_KEY);
          localStorage.removeItem(LS_USER_KEY);
          setUser(null);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  /** ------------------------------------------------------
   * SIGNUP
   * ------------------------------------------------------ */
  const signup = async (
    name: string,
    username: string,
    email: string,
    password: string,
    contact_number: string,
    permanent_address: string,
    country: string,
    city: string,
    contact_number_2?: string
  ) => {
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      // Auto login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data?.session) throw error || new Error("Auto login failed");

      const token = data.session.access_token;
      const uid = data.user?.id;
      if (!uid) throw new Error("Missing supabase user id");

      localStorage.setItem(LS_TOKEN_KEY, token);

      // Call backend to create profile
      const resp = await axios.post(
        `${API_BASE}/profiles`,
        {
          username,
          email,
          name,
          contact_number,
          permanent_address,
          country,
          city,
          contact_number_2: contact_number_2 ?? null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(resp.data);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
    } catch (err: any) {
      console.error("Signup error:", err);
      throw new Error(
        err?.message || err?.response?.data?.detail || "Signup failed"
      );
    }
  };

  /** ------------------------------------------------------
   * LOGIN
   * ------------------------------------------------------ */
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data?.session || !data.user)
        throw error || new Error("Login failed");

      const token = data.session.access_token;
      const uid = data.user.id;

      localStorage.setItem(LS_TOKEN_KEY, token);

      const resp = await axios.get(`${API_BASE}/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(resp.data);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
    } catch (err: any) {
      console.error("Login error:", err);
      throw new Error(
        err?.message || err?.response?.data?.detail || "Login failed"
      );
    }
  };

  /** ------------------------------------------------------
   * LOGOUT
   * ------------------------------------------------------ */
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
      setUser(null);
    }
  };

  /** ------------------------------------------------------
   * REFRESH USER
   * ------------------------------------------------------ */
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem(LS_TOKEN_KEY);
      if (!token) throw new Error("Missing auth token");

      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) throw new Error("Missing supabase user id");

      const resp = await axios.get(`${API_BASE}/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(resp.data);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
    } catch (err) {
      console.error("Refresh user error:", err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      refreshUser,
      supabaseClient: supabase,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
