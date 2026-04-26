import { useState } from "react";
import { Award, TrendingUp, LayoutList, Eye, CheckCircle2, FlaskConical, Link, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { buildFunctionUrl } from "@/integrations/supabase/functionUrl";

export interface ScorecardData {
  strategy: { score: number; feedback: string };
  structure: { score: number; feedback: string };
  clarity: { score: number; feedback: string };
  completeness: { score: number; feedback: string };
  testability: { score: number; feedback: string };
  traceability: { score: number; feedback: string };
  overall: number;
  topSuggestions: string[];
}

interface DocumentScorecardProps {
  document: string;
}

const SCORE_URL = buildFunctionUrl("score-document");

const dimensionIcons = {
  strategy: TrendingUp,
  structure: LayoutList,
  clarity: Eye,
  completeness: CheckCircle2,
  testability: FlaskConical,
  traceability: Link,
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getProgressColor(score: number) {
  if (score >= 80) return "[&>div]:bg-green-600 dark:[&>div]:bg-green-400";
  if (score >= 60) return "[&>div]:bg-yellow-600 dark:[&>div]:bg-yellow-400";
  return "[&>div]:bg-red-600 dark:[&>div]:bg-red-400";
}

export function DocumentScorecard({ document }: DocumentScorecardProps) {
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const handleScore = async () => {
    if (!document || document.trim().length < 50) {
      toast({
        title: t("scorecard.error"),
        description: t("scorecard.tooShort"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsVisible(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: t("scorecard.error"), description: "Not authenticated", variant: "destructive" });
        setIsVisible(false);
        return;
      }

      const resp = await fetch(SCORE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ document, language }),
      });

      if (resp.status === 429) {
        toast({ title: t("error.tooManyRequests"), variant: "destructive" });
        setIsVisible(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: t("error.creditsExhausted"), variant: "destructive" });
        setIsVisible(false);
        return;
      }
      if (!resp.ok) throw new Error("Score request failed");

      const data: ScorecardData = await resp.json();
      setScorecard(data);
    } catch {
      toast({
        title: t("scorecard.error"),
        description: t("scorecard.errorDesc"),
        variant: "destructive",
      });
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dimensions = scorecard
    ? (["strategy", "structure", "clarity", "completeness", "testability", "traceability"] as const).map((key) => ({
        key,
        label: t(`scorecard.${key}` as any),
        icon: dimensionIcons[key],
        ...scorecard[key],
      }))
    : [];

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleScore}
            disabled={!document || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Award className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("scorecard.button")}</TooltipContent>
      </Tooltip>

      <Dialog open={isVisible} onOpenChange={setIsVisible}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-primary" />
              {t("scorecard.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{t("scorecard.analyzing")}</p>
              </div>
            ) : scorecard ? (
              <>
                <div className="text-center pb-3 border-b border-border">
                  <div className={`text-4xl font-bold ${getScoreColor(scorecard.overall)}`}>
                    {scorecard.overall}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t("scorecard.overallScore")}</p>
                </div>

                <div className="space-y-3">
                  {dimensions.map(({ key, label, icon: Icon, score, feedback }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{label}</span>
                        </div>
                        <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}</span>
                      </div>
                      <Progress value={score} className={`h-1.5 ${getProgressColor(score)}`} />
                      <p className="text-xs text-muted-foreground">{feedback}</p>
                    </div>
                  ))}
                </div>

                {scorecard.topSuggestions?.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">{t("scorecard.suggestions")}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scorecard.topSuggestions.map((suggestion, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
