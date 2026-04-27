import { Link } from "react-router-dom";
import {
  Hammer,
  MessageSquare,
  FileText,
  Download,
  ArrowRight,
  Languages,
  Search,
  Users,
  WifiOff,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import heroImage from "@/assets/hero-illustration.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Footer } from "@/components/layout/Footer";

export default function Landing() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const features = [
    { icon: MessageSquare, titleKey: "landing.feature1.title" as const, descKey: "landing.feature1.desc" as const },
    { icon: FileText, titleKey: "landing.feature2.title" as const, descKey: "landing.feature2.desc" as const },
    { icon: Download, titleKey: "landing.feature3.title" as const, descKey: "landing.feature3.desc" as const },
    { icon: Search, titleKey: "landing.feature4.title" as const, descKey: "landing.feature4.desc" as const },
    { icon: Users, titleKey: "landing.feature5.title" as const, descKey: "landing.feature5.desc" as const },
    { icon: WifiOff, titleKey: "landing.feature6.title" as const, descKey: "landing.feature6.desc" as const },
  ];

  const steps = [
    { key: "landing.step1" as const, icon: Sparkles },
    { key: "landing.step2" as const, icon: Zap },
    { key: "landing.step3" as const, icon: Shield },
  ];

  const stats = [
    { valueKey: "landing.stat1.value" as const, labelKey: "landing.stat1.label" as const },
    { valueKey: "landing.stat2.value" as const, labelKey: "landing.stat2.label" as const },
    { valueKey: "landing.stat3.value" as const, labelKey: "landing.stat3.label" as const },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground"
      >
        {language === "de" ? "Zum Hauptinhalt springen" : "Skip to main content"}
      </a>
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="h-full px-4 md:px-8 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Hammer className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">ReqSmith</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "de" ? "en" : "de")}
              className="h-8 px-2 gap-1 text-xs font-medium"
            >
              <Languages className="w-4 h-4" />
              {language === "de" ? "EN" : "DE"}
            </Button>
            {user ? (
              <Button size="sm" asChild>
                <Link to="/app">{t("landing.cta")}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{t("auth.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">{t("auth.signup")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="main-content" className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <Badge variant="secondary" className="gap-2 px-4 py-1.5 text-sm">
            <Hammer className="w-4 h-4" />
            {t("landing.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            {t("landing.heroTitle")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
          <p className="text-sm text-muted-foreground/90">
            {t("landing.hobbyNotice")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button size="lg" asChild>
              <Link to="/auth" className="gap-2">
                {t("landing.cta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero image with glow */}
        <div className="max-w-5xl mx-auto mt-16 relative z-10">
          <div className="absolute inset-0 bg-primary/10 rounded-xl blur-2xl scale-95" />
          <img
            src={heroImage}
            alt="ReqSmith – KI-gestützte Dokumentenerstellung mit Chat und Editor"
            className="w-full rounded-xl shadow-2xl border border-border relative"
            width={896}
            height={504}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{t(stat.valueKey)}</div>
                <div className="text-sm text-muted-foreground mt-1">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 md:py-24 border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-border bg-card group hover:shadow-md transition-shadow duration-200">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t(f.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-14">
            {t("landing.howTitle")}
          </h2>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <step.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div className="pt-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {language === "de" ? `Schritt ${i + 1}` : `Step ${i + 1}`}
                  </div>
                  <p className="text-foreground font-medium">{t(step.key)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / trust */}
      <section className="px-4 py-16 md:py-20 border-t border-border bg-secondary/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("landing.trustedTitle")}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            {t("landing.trustedSubtitle")}
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl scale-150" />
        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-muted-foreground">{t("landing.ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" className="gap-2">
                {t("landing.cta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
