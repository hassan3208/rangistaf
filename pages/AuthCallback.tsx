import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; // IMPORTANT
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function processAuth() {
      // 1. Let Supabase process the URL tokens
      const { data, error } = await supabase.auth.getSession();

      console.log("OAuth session:", data, error);

      // 2. Refresh your user context
      await refreshUser();

      // 3. Now redirect
      navigate("/", { replace: true });
    }

    processAuth();
  }, []);

  return <p>Logging you in...</p>;
}
