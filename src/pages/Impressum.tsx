import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Impressum() {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <Button variant="ghost" size="sm" asChild className="mb-8 gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            {isEn ? "Back" : "Zurück"}
          </Link>
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-8">
          {isEn ? "Legal Notice" : "Impressum"}
        </h1>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              {isEn ? "Information pursuant to § 5 TMG" : "Angaben gemäß § 5 TMG"}
            </h2>
            <p>
              Your Name / Company<br />
              Sample Street 1<br />
              12345 Sample City
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              {isEn ? "Contact" : "Kontakt"}
            </h2>
            <p>
              {isEn ? "Email" : "E-Mail"}:{" "}
              <a href="mailto:legal@example.com" className="text-primary hover:underline">
                legal@example.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              {isEn
                ? "Responsible for content pursuant to § 18 (2) MStV"
                : "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV"}
            </h2>
            <p>
              Your Name / Company<br />
              Sample Street 1<br />
              12345 Sample City
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              {isEn ? "Disclaimer" : "Haftungsausschluss"}
            </h2>

            <h3 className="font-medium mt-4 mb-1">
              {isEn ? "Liability for Content" : "Haftung für Inhalte"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "The contents of this website have been created with the utmost care. However, no guarantee can be given for the accuracy, completeness, or timeliness of the content. As a service provider, I am responsible for my own content on these pages in accordance with § 7 (1) TMG under general law. According to §§ 8–10 TMG, however, I am not obligated as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity."
                : "Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden. Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen."}
            </p>

            <h3 className="font-medium mt-4 mb-1">
              {isEn ? "Liability for Links" : "Haftung für Links"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "This website contains links to external third-party websites over whose content I have no influence. Therefore, I cannot assume any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content."
                : "Diese Seite enthält Links zu externen Webseiten Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich."}
            </p>

            <h3 className="font-medium mt-4 mb-1">
              {isEn ? "Copyright" : "Urheberrecht"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "The content and works created by the site operator on these pages are subject to German copyright law. Reproduction, editing, distribution, and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator."
                : "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              {isEn ? "Notice" : "Hinweis"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "ReqSmith is a private hobby project and is not operated commercially."
                : "ReqSmith ist ein privates Hobbyprojekt und wird nicht gewerblich betrieben."}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {isEn
                ? "GDPR Notice: Please do not enter any personal data (PII) or sensitive customer data."
                : "DSGVO-Hinweis: Bitte keine personenbezogenen Daten (PII) oder sensible Kundendaten eingeben."}
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
