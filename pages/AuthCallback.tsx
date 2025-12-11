import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function run() {
      await refreshUser(); // Wait for Supabase to extract tokens from URL
      navigate("/", { replace: true });
    }
    run();
  }, []);


  return <p>Logging you in...</p>;
}
