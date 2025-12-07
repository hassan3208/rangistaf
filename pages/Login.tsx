import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api-config";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";


export default function Login() {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();



  const handleForgotPassword = async () => {
    if (!loginInput) {
      setError("Please enter your email first.");
      return;
    }
  
    try {
      setError(null);
  
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginInput }),
      });
  
      if (!response.ok) {
        const msg = await response.json();
        throw new Error(msg.detail || "Failed to send reset email");
      }
  
      alert("Reset email sent successfully!");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(loginInput, password);
      navigate("/"); // redirect to home after successful login
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || "Login failed");
      }
    }
  };

  return (
    <div className="container py-16 max-w-md mx-auto">
      <h1 className="font-serif text-3xl">Login</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm">Email</label>
          <Input
            type="text"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="text-sm">Password</label>
        
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="pr-10"
            />
        
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        
        <p
          className="text-sm text-blue-600 underline cursor-pointer"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </p>


        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full">
          Login
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          No account? <Link to="/signup" className="underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
