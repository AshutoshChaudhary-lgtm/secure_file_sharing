
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to log in");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-transparent border border-[#555555] text-white placeholder:text-gray-400 rounded-md h-12"
          />
          
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-transparent border border-[#555555] text-white placeholder:text-gray-400 rounded-md h-12"
          />
        </div>
        
        <Button type="submit" className="w-full h-12 rounded-md gradient-btn text-white font-medium" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Sign In"}
        </Button>
        
        <div className="flex items-center justify-between pt-2 text-sm">
          <Link to="/forgot-password" className="text-gray-400 hover:text-white transition-colors">
            Forgot Password
          </Link>
          <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
            Signup
          </Link>
        </div>
      </form>
    </div>
  );
}
