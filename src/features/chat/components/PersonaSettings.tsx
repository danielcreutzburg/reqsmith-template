import { useState, useEffect } from "react";
import { Settings2, Shield, Scale, Heart } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import type { AiPersona, Verbosity } from "@/types/chat";

interface PersonaSettingsProps {
  persona: AiPersona;
  verbosity: Verbosity;
  onPersonaChange: (persona: AiPersona) => void;
  onVerbosityChange: (verbosity: Verbosity) => void;
}

const personaIcons: Record<AiPersona, typeof Shield> = {
  "strict-cpo": Shield,
  "balanced": Scale,
  "supportive-mentor": Heart,
};

export function PersonaSettings({ persona, verbosity, onPersonaChange, onVerbosityChange }: PersonaSettingsProps) {
  const { t } = useLanguage();

  const personas: { id: AiPersona; label: string; desc: string }[] = [
    { id: "strict-cpo", label: t("persona.strictCpo" as any), desc: t("persona.strictCpoDesc" as any) },
    { id: "balanced", label: t("persona.balanced" as any), desc: t("persona.balancedDesc" as any) },
    { id: "supportive-mentor", label: t("persona.supportiveMentor" as any), desc: t("persona.supportiveMentorDesc" as any) },
  ];

  const verbosityLevels: { id: Verbosity; label: string }[] = [
    { id: "concise", label: t("verbosity.concise" as any) },
    { id: "normal", label: t("verbosity.normal" as any) },
    { id: "detailed", label: t("verbosity.detailed" as any) },
  ];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("persona.settings" as any)}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">{t("persona.title" as any)}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("persona.description" as any)}</p>
            <div className="space-y-1.5">
              {personas.map((p) => {
                const Icon = personaIcons[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => onPersonaChange(p.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                      persona === p.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${persona === p.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className={`text-sm font-medium ${persona === p.id ? "text-primary" : "text-foreground"}`}>{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold">{t("verbosity.title" as any)}</Label>
            <div className="flex gap-1.5 mt-2">
              {verbosityLevels.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onVerbosityChange(v.id)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    verbosity === v.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
