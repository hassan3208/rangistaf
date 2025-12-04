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






















import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api-config";
import { createClient, SupabaseClient, Session, User as SupabaseUser } from "@supabase/supabase-js";

/**
 * NOTE:
 * - Uses the same Supabase URL / anon key as your welcome.html.
 * - If you prefer to store these in env vars, replace the constants below with env/config values.
 */

const SUPABASE_URL = "https://cgnxzhlufpomntqygmvk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbnh6aGx1ZnBvbW50cXlnbXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDI0NDQsImV4cCI6MjA4MDIxODQ0NH0.iIjDMMAiYK_AVk7Jovc0gbxZWsVjnNbedj4nXIhfftM";

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  supabaseClient: SupabaseClient;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LS_USER_KEY = "rangista_user";
const LS_TOKEN_KEY = "token";
const API_BASE = API_BASE_URL; // keep existing config

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: try to reuse session from supabase or token from localStorage
  useEffect(() => {
    // Keep localStorage clean (same as before)
    Object.keys(localStorage).forEach((key) => {
      if (key !== "rangista_favorites" && key !== LS_TOKEN_KEY) {
        localStorage.removeItem(key);
      }
    });

    // 1) check supabase session
    supabase.auth.getSession().then(({ data }) => {
      const session: Session | null = data.session;
      if (session) {
        const token = session.access_token;
        localStorage.setItem(LS_TOKEN_KEY, token);
        // Try to load profile from backend
        const supabaseUser = session.user as SupabaseUser;
        if (supabaseUser?.id) {
          axios
            .get(`${API_BASE}/users/${supabaseUser.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((resp) => {
              setUser(resp.data);
              sessionStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
            })
            .catch(() => {
              // If backend fetch fails, still set minimal user from supabase
              setUser({ id: supabaseUser.id, email: supabaseUser.email ?? "" });
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        // If no supabase session, fallback to token + sessionStorage user
        const raw = sessionStorage.getItem(LS_USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
        }
        setLoading(false);
      }
    });

    // subscribe to auth changes to keep token in sync
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem(LS_TOKEN_KEY, session.access_token);
        const supabaseUser = session.user;
        if (supabaseUser?.id) {
          // fetch profile from backend
          axios
            .get(`${API_BASE}/users/${supabaseUser.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            .then((resp) => {
              setUser(resp.data);
              sessionStorage.setItem(LS_USER_KEY, JSON.stringify(resp.data));
            })
            .catch(() => {
              setUser({ id: supabaseUser.id, email: supabaseUser.email ?? "" });
            });
        } else {
          setUser(null);
        }
      } else {
        localStorage.removeItem(LS_TOKEN_KEY);
        sessionStorage.removeItem(LS_USER_KEY);
        setUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Signup: uses Supabase then calls backend /profiles
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
      // 1) create in supabase auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        throw signUpError;
      }

      // 2) auto sign in to get session (signUp may not auto create a session in some configs)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError || !loginData?.session) {
        throw loginError || new Error("Auto login failed");
      }

      const token = loginData.session.access_token;
      const supabaseUser = loginData.user as SupabaseUser;
      if (!supabaseUser?.id) {
        throw new Error("Missing supabase user id");
      }

      // store token
      localStorage.setItem(LS_TOKEN_KEY, token);

      // 3) call backend to create profile
      const res = await axios.post(
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // backend returns created user - store it
      sessionStorage.setItem(LS_USER_KEY, JSON.stringify(res.data));
      setUser(res.data);
    } catch (error: any) {
      // normalize error
      console.error("Signup error", error);
      throw new Error(error?.message || error?.response?.data?.detail || "Signup failed");
    }
  };

  // Login: supabase login -> get token -> fetch backend user by supabase id
  const login = async (loginInput: string, password: string) => {
    try {
      // sign in using supabase (loginInput can be email/username/phone but supabase will only accept email by default)
      // We assume users sign in with email here (as welcome.html)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginInput,
        password,
      });
      if (error || !data?.session || !data.user) {
        throw error || new Error("Login failed");
      }

      const token = data.session.access_token;
      const supabaseUser = data.user as SupabaseUser;
      if (!supabaseUser?.id) throw new Error("Missing supabase user id");

      localStorage.setItem(LS_TOKEN_KEY, token);

      // fetch profile from backend
      const userResp = await axios.get(`${API_BASE}/users/${supabaseUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userResp.data));
      setUser(userResp.data);
    } catch (error: any) {
      console.error("Login error", error);
      throw new Error(error?.message || error?.response?.data?.detail || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    } finally {
      sessionStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(LS_TOKEN_KEY);
    if (!token) throw new Error("Missing auth token");
    // Try to extract supabase user id from session
    const { data } = await supabase.auth.getSession();
    const supabaseUserId = data.session?.user?.id;
    if (!supabaseUserId) throw new Error("Missing supabase user id");
    const userResp = await axios.get(`${API_BASE}/users/${supabaseUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    sessionStorage.setItem(LS_USER_KEY, JSON.stringify(userResp.data));
    setUser(userResp.data);
  };

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, refreshUser, supabaseClient: supabase }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use Auth context
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
