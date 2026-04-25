import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

const examplesDe = [
  "OAuth-Login-Integration mit Google und GitHub",
  "Warenkorb mit Rabattcode-Funktion für einen Online-Shop",
  "Buchungssystem mit Kalenderintegration und Benachrichtigungen",
  "REST-API zur Benutzerverwaltung mit rollenbasierter Zugriffskontrolle",
  "Volltextsuche mit Filtern, Facetten und Auto-Suggest",
];

const examplesEn = [
  "OAuth login integration with Google and GitHub",
  "Shopping cart with discount code feature for an online store",
  "Booking system with calendar integration and notifications",
  "REST API for user management with role-based access control",
  "Full-text search with filters, facets, and auto-suggest",
];

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  const { language, t } = useLanguage();
  const examples = language === "de" ? examplesDe : examplesEn;

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>{t("chat.examples.title")}</span>
      </div>
      <div className="grid gap-2">
        {examples.map((example, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-auto py-2.5 px-3 text-left text-xs whitespace-normal justify-start font-normal"
            onClick={() => onSelect(example)}
          >
            {example}
          </Button>
        ))}
      </div>
    </div>
  );
}
