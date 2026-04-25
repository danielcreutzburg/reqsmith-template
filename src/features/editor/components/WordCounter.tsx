import { useLanguage } from "@/i18n/LanguageContext";

interface WordCounterProps {
  document: string;
}

export function WordCounter({ document }: WordCounterProps) {
  const { t } = useLanguage();

  if (!document) return null;

  const words = document.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));
  const sections = (document.match(/^#{1,3}\s/gm) || []).length;

  return (
    <div className="flex items-center gap-4 px-6 py-2 border-t border-border text-xs text-muted-foreground">
      <span>{t("doc.stats.words", { count: String(words) })}</span>
      <span>{t("doc.stats.readingTime", { minutes: String(readingTimeMin) })}</span>
      <span>{t("doc.stats.sections", { count: String(sections) })}</span>
    </div>
  );
}
