import { cn } from "@/lib/utils";

interface LiquidProgressProps {
  className?: string;
  label?: string;
}

/**
 * Indeterminate liquid-glass progress bar.
 * Renders a frosted track with a glossy highlight that travels across it.
 */
export const LiquidProgress = ({ className, label }: LiquidProgressProps) => {
  return (
    <div className={cn("w-full", className)} role="progressbar" aria-label={label || "Loading"}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">working…</span>
        </div>
      )}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full glass">
        <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-foreground/70 liquid-progress-bar" />
      </div>
    </div>
  );
};
