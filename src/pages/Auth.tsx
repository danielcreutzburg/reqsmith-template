import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Hammer, Mail, Lock, User, ArrowLeft, Eye, EyeOff, ShieldAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useLoginRateLimit } from "@/hooks/useLoginRateLimit";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [networkIssue, setNetworkIssue] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { check: checkRateLimit, clear: clearRateLimit } = useLoginRateLimit();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (waitSeconds <= 0) {
      setRateLimited(false);
      return;
    }
    const timer = setTimeout(() => setWaitSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [waitSeconds]);

  if (user) return <Navigate to="/app" replace />;

  const runConnectivityCheck = async () => {
    setDiagLoading(true);
    try {
      const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (!projectUrl || !key) {
        toast({
          title: "Supabase env missing",
          description: "VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not set.",
          variant: "destructive",
        });
        return;
      }
      const normalizedUrl = projectUrl.trim().replace(/^["'](.*)["']$/, "$1");
      const normalizedKey = key.trim().replace(/^["'](.*)["']$/, "$1");
      const endpoint = `${normalizedUrl}/auth/v1/token?grant_type=password`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: normalizedKey,
          Authorization: `Bearer ${normalizedKey}`,
          "Content-Type": "application/json",
          "x-client-info": "reqsmith-auth-diag",
        },
        body: JSON.stringify({
          email: "connectivity-check@example.com",
          password: "invalid-password",
        }),
      });
      toast({
        title: "Supabase connectivity OK",
        description: `Auth endpoint reachable (${response.status}). Origin: ${window.location.origin}`,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Supabase connectivity failed",
        description: `${detail}. Origin: ${window.location.origin}`,
        variant: "destructive",
      });
    } finally {
      setDiagLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) {
        toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      }
    } catch {
      toast({ title: t("auth.error"), description: "Google login failed", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.resetLinkSent"), description: t("auth.resetLinkSentDesc") });
        setMode("login");
      }
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { status, waitSeconds: wait } = await checkRateLimit(email);
      if (status === "limited") {
        const seconds = wait || 60;
        setRateLimited(true);
        setWaitSeconds(seconds);
        setNetworkIssue(false);
        toast({
          title: t("auth.rateLimitedTitle"),
          description: t("auth.rateLimited").replace("{seconds}", String(seconds)),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (status === "network_error") {
        // Fail-open: don't block the user, but make the degraded state visible.
        setNetworkIssue(true);
        toast({
          title: t("auth.networkIssueTitle"),
          description: t("auth.networkIssueDesc"),
        });
      } else {
        setNetworkIssue(false);
      }
    }

    if (mode === "signup" && password.length < 8) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, displayName);

    if (error) {
      const isUnconfirmed = error.toLowerCase().includes("email not confirmed");
      toast({
        title: t("auth.error"),
        description: isUnconfirmed ? t("auth.emailNotConfirmed") : error,
        variant: "destructive",
      });
    } else if (mode === "login") {
      await clearRateLimit(email);
    } else if (mode === "signup") {
      toast({ title: t("auth.checkEmail"), description: t("auth.checkEmailDesc") });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md space-y-3 relative z-10">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backToLanding")}
          </Link>
        </Button>

        <Card className="w-full shadow-lg border-border/50">
          <CardHeader className="text-center pb-4">
            <Link to="/" className="inline-block">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-md">
                <Hammer className="w-7 h-7 text-primary-foreground" />
              </div>
            </Link>
            <CardTitle className="text-2xl">
              <Link to="/" className="hover:opacity-80 transition-opacity">ReqSmith</Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {mode === "forgot"
                ? t("auth.forgotPasswordDesc")
                : mode === "login"
                  ? t("auth.loginDesc")
                  : t("auth.signupDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode !== "forgot" && (
              <>
                <Button
                  variant="outline"
                  className="w-full gap-2 h-11"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? "..." : t("auth.googleLogin")}
                </Button>

                <div className="relative my-5">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                    {t("auth.orEmail")}
                  </span>
                </div>
              </>
            )}

            {mode === "login" && rateLimited && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">{t("auth.rateLimitedTitle")}</p>
                  <p className="text-destructive/90">
                    {t("auth.rateLimitedBanner").replace("{seconds}", String(waitSeconds))}
                  </p>
                </div>
              </div>
            )}
            {mode === "login" && networkIssue && !rateLimited && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
              >
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">{t("auth.networkIssueTitle")}</p>
                  <p>{t("auth.networkIssueDesc")}</p>
                </div>
              </div>
            )}
            {mode === "login" && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={runConnectivityCheck}
                  disabled={diagLoading}
                >
                  {diagLoading ? "Connectivity check..." : "Supabase-Verbindung testen"}
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t("auth.displayName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-9 h-11"
                      placeholder={t("auth.displayNamePlaceholder")}
                      required={mode === "signup"}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11"
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-11"
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading || rateLimited}>
                {rateLimited
                  ? t("auth.rateLimitedShort").replace("{seconds}", String(waitSeconds))
                  : loading
                    ? "..."
                    : mode === "forgot"
                      ? t("auth.sendResetLink")
                      : mode === "login"
                        ? t("auth.login")
                        : t("auth.signup")}
              </Button>
            </form>
            <div className="mt-5 text-center">
              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("auth.backToLogin")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "login" ? t("auth.switchToSignup") : t("auth.switchToLogin")}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground px-4">
          {t("auth.termsNotice")}
        </p>
      </div>
    </div>
  );
}
