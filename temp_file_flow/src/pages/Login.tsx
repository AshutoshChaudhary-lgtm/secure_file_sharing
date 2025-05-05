
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";

const Login = () => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    document.title = "Login - DropLock";
  }, []);
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container py-8 px-4 mx-auto flex flex-1 flex-col justify-center items-center relative">
        <div className="login-circles">
          <div className="login-circle login-circle-1"></div>
          <div className="login-circle login-circle-2"></div>
          <div className="login-circle login-circle-3"></div>
          
          <div className="login-form-container">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Login</h1>
            </div>
            
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
