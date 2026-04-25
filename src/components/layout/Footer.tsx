import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>{t("footer.gdpr")}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/datenschutz" className="hover:text-foreground transition-colors">
            {t("footer.privacy")}
          </Link>
          <Link to="/impressum" className="hover:text-foreground transition-colors">
            {t("footer.imprint")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
