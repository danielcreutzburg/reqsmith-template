import { useState, useEffect } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface FollowUpSuggestionsProps {
  lastAssistantMessage: string;
  onSelect: (prompt: string) => void;
  templateId?: string;
  disabled?: boolean;
}

function generateSuggestions(message: string, templateId?: string, language = "de"): string[] {
  const isGerman = language === "de";
  const suggestions: string[] = [];

  // Check what phase the conversation is in based on content
  const hasDocument = message.includes("##") || message.includes("---DOCUMENT---");
  const hasQuestions = message.includes("?");
  const isFirstResponse = message.length < 500 && hasQuestions;

  if (isFirstResponse || hasQuestions) {
    // AI asked questions - suggest answering or generating
    suggestions.push(
      isGerman
        ? "Erstelle das Dokument mit den bisherigen Informationen"
        : "Generate the document with the information so far"
    );
    suggestions.push(
      isGerman
        ? "Ich möchte zuerst noch weitere Details klären"
        : "I want to clarify more details first"
    );
  }

  if (hasDocument) {
    // Document was generated
    suggestions.push(
      isGerman
        ? "Überprüfe das Dokument auf Vollständigkeit und Konsistenz"
        : "Review the document for completeness and consistency"
    );
    suggestions.push(
      isGerman
        ? "Füge konkrete Beispiele und Metriken hinzu"
        : "Add concrete examples and metrics"
    );
    suggestions.push(
      isGerman
        ? "Erstelle eine Zusammenfassung der wichtigsten Punkte"
        : "Create a summary of the key points"
    );
  }

  // Template-specific suggestions
  if (templateId) {
    switch (templateId) {
      case "modern-prd":
        if (!hasDocument) {
          suggestions.push(isGerman ? "Welche Stakeholder sind betroffen?" : "Who are the stakeholders?");
        } else {
          suggestions.push(isGerman ? "Ergänze die Risiken und Abhängigkeiten" : "Add risks and dependencies");
        }
        break;
      case "agile-user-story":
        suggestions.push(
          isGerman ? "Prüfe die INVEST-Kriterien und schlage Splitting vor" : "Check INVEST criteria and suggest splitting"
        );
        break;
      case "competitive-analysis":
        suggestions.push(
          isGerman ? "Erstelle eine Feature-Vergleichsmatrix" : "Create a feature comparison matrix"
        );
        break;
      case "product-roadmap":
        suggestions.push(
          isGerman ? "Priorisiere die Initiativen mit RICE-Score" : "Prioritize initiatives with RICE score"
        );
        break;
    }
  }

  // Generic fallbacks
  if (suggestions.length < 2) {
    suggestions.push(
      isGerman ? "Mache das Dokument detaillierter" : "Make the document more detailed"
    );
    suggestions.push(
      isGerman ? "Welche Aspekte fehlen noch?" : "What aspects are still missing?"
    );
  }

  // Return max 3 unique suggestions
  return [...new Set(suggestions)].slice(0, 3);
}

export function FollowUpSuggestions({ lastAssistantMessage, onSelect, templateId, disabled }: FollowUpSuggestionsProps) {
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (lastAssistantMessage) {
      setSuggestions(generateSuggestions(lastAssistantMessage, templateId, language));
      setDismissed(false);
    }
  }, [lastAssistantMessage, templateId, language]);

  if (dismissed || suggestions.length === 0 || !lastAssistantMessage || disabled) return null;

  return (
    <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lightbulb className="w-3 h-3" />
        <span>{language === "de" ? "Vorgeschlagene nächste Schritte" : "Suggested next steps"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-auto py-1.5 px-3 text-xs whitespace-normal text-left justify-start gap-1.5 max-w-full"
            onClick={() => {
              onSelect(suggestion);
              setDismissed(true);
            }}
          >
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="line-clamp-2">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
