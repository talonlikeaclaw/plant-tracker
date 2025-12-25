import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  // State for user inputs and UI feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation for empty fields
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      // Call API to login user and store JWT token then redirect
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.access_token);
      // Use window.location to force full page reload and re-evaluate auth state
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Theme toggle in top-right */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Left: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-muted">
        <Card className="w-[400px] p-6 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-primary">
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="grid w-full max-w-sm items-center gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  className="bg-input text-foreground"
                />
              </div>

              {/* Password */}
              <div className="grid w-full max-w-sm items-center gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="bg-input text-foreground"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:opacity-90"
              >
                {loading ? "Logging in..." : "Log In"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>
                    <p>{error}</p>
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-center text-sm mt-4">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right: Welcome Message */}
      <div className="hidden md:flex w-1/2 items-center justify-center bg-primary/10">
        <p className="text-2xl font-bold text-foreground">
          Welcome to PlantTracker 🌿
        </p>
      </div>
    </div>
  );
}
