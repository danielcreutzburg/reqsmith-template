import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/i18n/LanguageContext";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h3 className="font-medium mt-4 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </>
  );
}

export default function Datenschutz() {
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
          {isEn ? "Privacy Policy" : "Datenschutzerklärung"}
        </h1>

        <div className="space-y-6 text-foreground">
          {/* 1. Verantwortlicher */}
          <Section title={isEn ? "1. Data Controller" : "1. Verantwortlicher"}>
            <p>
              Your Name / Company<br />
              Sample Street 1<br />
              12345 Sample City<br />
              {isEn ? "Email" : "E-Mail"}:{" "}
              <a href="mailto:legal@example.com" className="text-primary hover:underline">
                legal@example.com
              </a>
            </p>
          </Section>

          {/* 2. Überblick */}
          <Section title={isEn ? "2. Overview of Data Processing" : "2. Überblick über die Datenverarbeitung"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "ReqSmith is a private hobby project. Using the application requires the creation of a user account. Below, I inform you about what personal data is collected and how it is processed."
                : "ReqSmith ist ein privates Hobbyprojekt. Die Nutzung der Anwendung erfordert die Erstellung eines Benutzerkontos. Im Folgenden informiere ich Sie darüber, welche personenbezogenen Daten erhoben und wie diese verarbeitet werden."}
            </p>
          </Section>

          {/* 3. Erhobene Daten */}
          <Section title={isEn ? "3. Data Collected" : "3. Erhobene Daten"}>
            <SubSection title={isEn ? "a) Registration and Authentication" : "a) Registrierung und Authentifizierung"}>
              {isEn
                ? "During registration, your email address is collected and stored. It is used to identify your user account and for login purposes. You may optionally provide a display name and a profile picture. Processing is based on Art. 6(1)(b) GDPR (contract performance)."
                : "Bei der Registrierung wird Ihre E-Mail-Adresse erhoben und gespeichert. Diese dient zur Identifizierung Ihres Benutzerkontos und zum Login. Optional können Sie einen Anzeigenamen und ein Profilbild hinterlegen. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)."}
            </SubSection>

            <SubSection title={isEn ? "b) Usage Data" : "b) Nutzungsdaten"}>
              {isEn
                ? "When using ReqSmith, the following data is processed and stored:"
                : "Bei der Nutzung von ReqSmith werden folgende Daten verarbeitet und gespeichert:"}
            </SubSection>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>{isEn ? "Chat messages and generated documents (to provide core functionality)" : "Chat-Nachrichten und erstellte Dokumente (zur Bereitstellung der Kernfunktionalität)"}</li>
              <li>{isEn ? "Document versions and revision history" : "Dokumentversionen und Änderungshistorie"}</li>
              <li>{isEn ? "Usage statistics (message counter for quota management)" : "Nutzungsstatistiken (Nachrichtenzähler zur Steuerung des Kontingents)"}</li>
              <li>{isEn ? "Custom templates and glossary entries" : "Eigene Vorlagen (Custom Templates) und Glossareinträge"}</li>
              <li>{isEn ? "Saved prompts and prompt history" : "Gespeicherte Prompts und Prompt-Verlauf"}</li>
              <li>{isEn ? "In-app notifications" : "In-App-Benachrichtigungen"}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn
                ? "Processing of this data is based on Art. 6(1)(b) GDPR."
                : "Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO."}
            </p>

            <SubSection title={isEn ? "c) AI Processing" : "c) KI-Verarbeitung"}>
              {isEn
                ? "Your chat inputs are transmitted to AI model providers via the Lovable AI Gateway for document generation. The following providers may process your data:"
                : "Ihre Chat-Eingaben werden zur Generierung von Dokumenten über das Lovable AI Gateway an KI-Modellanbieter übermittelt. Folgende Anbieter können Ihre Daten verarbeiten:"}
            </SubSection>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Google LLC</strong> (Gemini) – 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA
              </li>
              <li>
                <strong>OpenAI, Inc.</strong> (GPT) – 3180 18th Street, San Francisco, CA 94110, USA
              </li>
              <li>
                <strong>Anthropic, PBC</strong> (Claude) – 548 Market Street, San Francisco, CA 94104, USA
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn
                ? "Transfers to the USA are based on the EU-US Data Privacy Framework. Processing is based on Art. 6(1)(b) GDPR, as AI processing is the core function of the service. Please do not enter sensitive personal data in the chat."
                : "Die Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, da die KI-Verarbeitung die Kernfunktion des Dienstes darstellt. Bitte geben Sie keine sensiblen personenbezogenen Daten in den Chat ein."}
            </p>

            <SubSection title={isEn ? "d) Real-Time Collaboration" : "d) Echtzeit-Kollaboration"}>
              {isEn
                ? "When collaborating on documents in real time, the following data is processed: your user ID, display name, cursor position, and online status (presence). This data is transmitted to other collaborators of the same document via WebSocket connections. Inline comments and their author information are stored. Processing is based on Art. 6(1)(b) GDPR."
                : "Bei der Echtzeit-Zusammenarbeit an Dokumenten werden folgende Daten verarbeitet: Ihre Benutzer-ID, Anzeigename, Cursorposition und Online-Status (Präsenz). Diese Daten werden über WebSocket-Verbindungen an andere Mitarbeiter desselben Dokuments übermittelt. Inline-Kommentare und deren Autorinformationen werden gespeichert. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO."}
            </SubSection>

            <SubSection title={isEn ? "e) Document Sharing" : "e) Dokumenten-Teilen"}>
              {isEn
                ? "You may share documents via public links. Shared documents contain the document content, title, and template name. If comments are enabled, visitors may leave comments with a freely chosen name and optional email address. Processing is based on Art. 6(1)(a) GDPR (consent of the sharing user) and Art. 6(1)(f) GDPR (legitimate interest for commenters)."
                : "Sie können Dokumente über öffentliche Links teilen. Geteilte Dokumente enthalten den Dokumentinhalt, Titel und Vorlagennamen. Wenn Kommentare aktiviert sind, können Besucher Kommentare mit einem frei wählbaren Namen und einer optionalen E-Mail-Adresse hinterlassen. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung des teilenden Nutzers) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse bei Kommentatoren)."}
            </SubSection>

            <SubSection title={isEn ? "f) File Uploads" : "f) Datei-Uploads"}>
              {isEn
                ? "You may upload files (e.g., PDF, DOCX) as attachments in the chat. Uploaded files are processed server-side to extract text content for AI analysis. Files are stored temporarily for processing and are not retained beyond the session context. Processing is based on Art. 6(1)(b) GDPR."
                : "Sie können Dateien (z. B. PDF, DOCX) als Anhänge im Chat hochladen. Hochgeladene Dateien werden serverseitig verarbeitet, um Textinhalte für die KI-Analyse zu extrahieren. Dateien werden temporär zur Verarbeitung gespeichert und nicht über den Sitzungskontext hinaus aufbewahrt. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO."}
            </SubSection>



            <SubSection title={isEn ? "h) Technical Access Data" : "h) Technische Zugriffsdaten"}>
              {isEn
                ? "When visiting the website, technical data is automatically collected (e.g., IP address, browser type, time of access). This data is processed to ensure operation (Art. 6(1)(f) GDPR – legitimate interest)."
                : "Beim Besuch der Website werden automatisch technische Daten erfasst (z. B. IP-Adresse, Browsertyp, Zeitpunkt des Zugriffs). Diese Daten werden zur Sicherstellung des Betriebs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse)."}
            </SubSection>
          </Section>

          {/* 4. Hosting */}
          <Section title={isEn ? "4. Hosting and Data Processing" : "4. Hosting und Auftragsverarbeitung"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "The application is operated through the following third-party providers:"
                : "Die Anwendung wird über folgende Drittanbieter betrieben:"}
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li><strong>Lovable Technologies</strong> (lovable.dev) – {isEn ? "Hosting, deployment, and AI gateway" : "Hosting, Deployment und KI-Gateway"}</li>
              <li><strong>Supabase, Inc.</strong> – {isEn ? "Database operations, authentication, and real-time synchronization" : "Datenbankbetrieb, Authentifizierung und Echtzeit-Synchronisation"}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn
                ? "These providers may process data in countries outside the EU. Data processing agreements pursuant to Art. 28 GDPR are in place with the respective providers. An adequate level of data protection is ensured through the respective standard contractual clauses."
                : "Diese Anbieter verarbeiten Daten ggf. in Ländern außerhalb der EU. Mit den jeweiligen Anbietern bestehen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO. Ein angemessenes Datenschutzniveau wird durch die jeweiligen Standardvertragsklauseln sichergestellt."}
            </p>
          </Section>

          {/* 5. Speicherdauer */}
          <Section title={isEn ? "5. Data Retention" : "5. Speicherdauer"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "Your data is stored as long as your user account exists. After deletion of the account, the associated personal data will be deleted, unless statutory retention obligations apply. You may export your data at any time via the account settings."
                : "Ihre Daten werden so lange gespeichert, wie Ihr Benutzerkonto besteht. Nach Löschung des Kontos werden die zugehörigen personenbezogenen Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Sie können Ihre Daten jederzeit über die Kontoeinstellungen exportieren."}
            </p>
          </Section>

          {/* 6. Rechte */}
          <Section title={isEn ? "6. Your Rights" : "6. Ihre Rechte"}>
            <p className="text-sm text-muted-foreground">
              {isEn ? "You have the following rights:" : "Sie haben folgende Rechte:"}
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li><strong>{isEn ? "Access" : "Auskunft"}</strong> (Art. 15 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "What data is stored about you" : "Welche Daten über Sie gespeichert sind"}</li>
              <li><strong>{isEn ? "Rectification" : "Berichtigung"}</strong> (Art. 16 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "Correction of inaccurate data" : "Korrektur unrichtiger Daten"}</li>
              <li><strong>{isEn ? "Erasure" : "Löschung"}</strong> (Art. 17 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "Deletion of your data" : "Löschung Ihrer Daten"}</li>
              <li><strong>{isEn ? "Restriction" : "Einschränkung"}</strong> (Art. 18 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "Restriction of processing" : "Einschränkung der Verarbeitung"}</li>
              <li><strong>{isEn ? "Data Portability" : "Datenübertragbarkeit"}</strong> (Art. 20 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "Export of your data" : "Export Ihrer Daten"}</li>
              <li><strong>{isEn ? "Objection" : "Widerspruch"}</strong> (Art. 21 {isEn ? "GDPR" : "DSGVO"}) – {isEn ? "Objection to processing" : "Widerspruch gegen die Verarbeitung"}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn ? "To exercise your rights, please contact" : "Zur Ausübung Ihrer Rechte wenden Sie sich bitte an"}:{" "}
              <a href="mailto:legal@example.com" className="text-primary hover:underline">
                legal@example.com
              </a>
            </p>
          </Section>

          {/* 7. Beschwerderecht */}
          <Section title={isEn ? "7. Right to Complain" : "7. Beschwerderecht"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "You have the right to lodge a complaint with a data protection supervisory authority. The competent authority is the Bavarian State Office for Data Protection Supervision (BayLDA), Promenade 18, 91522 Ansbach, Germany."
                : "Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach."}
            </p>
          </Section>

          {/* 8. Cookies & Local Storage */}
          <Section title={isEn ? "8. Cookies and Local Storage" : "8. Cookies und Local Storage"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "ReqSmith uses only technically necessary cookies and local storage entries. The following data is stored locally on your device:"
                : "ReqSmith verwendet ausschließlich technisch notwendige Cookies bzw. Local-Storage-Einträge. Folgende Daten werden lokal auf Ihrem Gerät gespeichert:"}
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
              <li>{isEn ? "Login session token (authentication)" : "Login-Sitzungstoken (Authentifizierung)"}</li>
              <li>{isEn ? "Language setting (DE/EN)" : "Spracheinstellung (DE/EN)"}</li>
              <li>{isEn ? "Theme preference (light/dark/system)" : "Theme-Präferenz (Hell/Dunkel/System)"}</li>
              <li>{isEn ? "Cookie consent status" : "Cookie-Einwilligungsstatus"}</li>
              <li>{isEn ? "Onboarding completion status" : "Onboarding-Abschlussstatus"}</li>
              <li>{isEn ? "PWA offline cache (Service Worker) for offline access" : "PWA-Offline-Cache (Service Worker) für Offline-Zugriff"}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn
                ? "No tracking or advertising cookies are used. Separate consent is not required for technically necessary storage (§ 25(2) TDDDG)."
                : "Es werden keine Tracking- oder Werbe-Cookies eingesetzt. Eine gesonderte Einwilligung ist für technisch notwendige Speicherung nicht erforderlich (§ 25 Abs. 2 TDDDG)."}
            </p>
          </Section>

          {/* 9. Änderungen */}
          <Section title={isEn ? "9. Changes" : "9. Änderungen"}>
            <p className="text-sm text-muted-foreground">
              {isEn
                ? "This privacy policy may be updated as needed. The current version is always available on this page."
                : "Diese Datenschutzerklärung kann bei Bedarf angepasst werden. Die aktuelle Fassung ist stets auf dieser Seite abrufbar."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isEn ? "Last updated: March 2026" : "Stand: März 2026"}
            </p>
          </Section>

          <section>
            <p className="text-sm text-muted-foreground font-medium">
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
