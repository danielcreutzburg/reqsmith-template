/**
 * Passwort-Reset nach Klick auf den E-Mail-Recovery-Link.
 * Ablauf des Links: serverseitig konfiguriert (Lovable Cloud / Supabase Auth).
 * Siehe docs/SECURITY.md für Konfiguration des Recovery-Link-Ablaufs.
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Hammer, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({ title: t("auth.passwordResetSuccess") });
      setTimeout(() => navigate("/app"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link to="/auth">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.switchToLogin")}
          </Link>
        </Button>

        <Card className="w-full">
          <CardHeader className="text-center">
            <Link to="/" className="inline-block">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
                <Hammer className="w-6 h-6 text-primary-foreground" />
              </div>
            </Link>
            <CardTitle className="text-2xl">
              {t("auth.resetPassword")}
            </CardTitle>
            <CardDescription>
              {t("auth.resetPasswordDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle className="w-12 h-12 text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.passwordResetSuccess")}
                </p>
              </div>
            ) : !isRecovery ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {t("auth.invalidResetLink")}
                </p>
                <Button asChild className="mt-4">
                  <Link to="/auth">{t("auth.login")}</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.newPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "..." : t("auth.setNewPassword")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
