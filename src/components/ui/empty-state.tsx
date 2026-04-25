import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500 delay-100">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <h3 className="font-semibold text-foreground mb-1 text-center animate-in fade-in-0 duration-500 delay-200">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4 animate-in fade-in-0 duration-500 delay-300">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-400"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
