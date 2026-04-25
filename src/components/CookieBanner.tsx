import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const accepted = localStorage.getItem("reqsmith-cookie-consent");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("reqsmith-cookie-consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-3xl mx-auto rounded-lg border border-border bg-card shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1">
          {t("cookie.text")}{" "}
          <Link to="/datenschutz" className="underline text-foreground hover:text-primary">
            {t("cookie.link")}
          </Link>
        </p>
        <Button size="sm" onClick={accept} className="flex-shrink-0">
          {t("cookie.accept")}
        </Button>
      </div>
    </div>
  );
}
