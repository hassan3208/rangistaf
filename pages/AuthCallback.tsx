import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
    navigate("/");
  }, []);


  return <p>Logging you in...</p>;
}
