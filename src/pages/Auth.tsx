import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Sign up fields
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim() || !ownerName.trim() || !ownerPhone.trim() || !ownerEmail.trim() || !signupPassword.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: ownerEmail,
      password: signupPassword,
      options: {
        data: {
          business_name: businessName,
          owner_name: ownerName,
          owner_phone: ownerPhone,
        },
      },
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "You are now signed in." });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-2xl text-foreground">Instasellr</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to your dashboard" : "Create your store"}
          </p>
        </div>

        {isLogin ? (
          // LOGIN FORM
          <form onSubmit={handleLogin} className="bg-card rounded-xl p-6 store-shadow space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setEmail("");
                  setPassword("");
                }}
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          // SIGNUP FORM
          <form onSubmit={handleSignup} className="bg-card rounded-xl p-6 store-shadow space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Owner Name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Phone Number *</label>
              <input
                type="tel"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+880 1XX XXX XXXX"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Email *</label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Account
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setBusinessName("");
                  setOwnerName("");
                  setOwnerPhone("");
                  setOwnerEmail("");
                  setSignupPassword("");
                }}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
