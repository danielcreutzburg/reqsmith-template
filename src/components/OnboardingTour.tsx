import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  target: string;
  titleKey: string;
  descKey: string;
}

const TOUR_STEPS: TourStep[] = [
  { target: "template-selector", titleKey: "onboarding.step1.title", descKey: "onboarding.step1.desc" },
  { target: "chat-input", titleKey: "onboarding.step2.title", descKey: "onboarding.step2.desc" },
  { target: "document-panel", titleKey: "onboarding.step3.title", descKey: "onboarding.step3.desc" },
  { target: "export-button", titleKey: "onboarding.step4.title", descKey: "onboarding.step4.desc" },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  // Check DB for onboarding status
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("user_id", user.id)
        .single();
      if (data && !data.onboarding_done) {
        const timer = setTimeout(() => setActive(true), 800);
        setChecked(true);
        return () => clearTimeout(timer);
      }
      setChecked(true);
    };
    check();
  }, [user]);

  const updateHighlight = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(`[data-tour="${TOUR_STEPS[step].target}"]`);
    if (el) {
      setHighlight(el.getBoundingClientRect());
    } else {
      setHighlight(null);
    }
  }, [active, step]);

  useEffect(() => {
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  const finish = useCallback(async () => {
    setActive(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_done: true } as any)
        .eq("user_id", user.id);
    }
  }, [user]);

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const padding = 8;

  const tooltipStyle: React.CSSProperties = {};
  if (highlight) {
    const centerX = highlight.left + highlight.width / 2;
    const below = highlight.bottom + padding + 12;
    const above = highlight.top - padding - 12;

    if (below + 200 < window.innerHeight) {
      tooltipStyle.top = below;
    } else {
      tooltipStyle.bottom = window.innerHeight - above;
    }

    tooltipStyle.left = Math.max(16, Math.min(centerX - 160, window.innerWidth - 336));
    tooltipStyle.width = 320;
  } else {
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
    tooltipStyle.width = 320;
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlight && (
              <rect
                x={highlight.left - padding}
                y={highlight.top - padding}
                width={highlight.width + padding * 2}
                height={highlight.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {highlight && (
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
          style={{
            top: highlight.top - padding,
            left: highlight.left - padding,
            width: highlight.width + padding * 2,
            height: highlight.height + padding * 2,
          }}
        />
      )}

      <Card
        className="absolute p-4 shadow-xl border-primary/20 z-[201] animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {step + 1} / {TOUR_STEPS.length}
            </p>
            <h3 className="font-semibold text-foreground text-sm">
              {t(currentStep.titleKey as any)}
            </h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={finish}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t(currentStep.descKey as any)}
        </p>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={finish} className="text-xs">
            {t("onboarding.skip" as any)}
          </Button>
          <div className="flex gap-1">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={prev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {step < TOUR_STEPS.length - 1
                ? t("onboarding.next" as any)
                : t("onboarding.finish" as any)}
              {step < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
