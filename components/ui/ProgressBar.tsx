'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  color?: string;
  icon?: string;
}

export function ProgressBar({ value, max = 100, label, color, icon }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = color ?? 'bg-stone-400';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-stone-400 flex items-center gap-1">{icon && <span>{icon}</span>}{label}</span>
        <span className="text-[10px] text-stone-300 font-mono">{Math.round(value)}</span>
      </div>
      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
