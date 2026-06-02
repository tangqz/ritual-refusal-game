'use client';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
}

export function ChoiceButton({ text, onClick, disabled }: ChoiceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-3.5 bg-white hover:bg-stone-50 active:bg-stone-100
        rounded-xl transition-colors disabled:opacity-40 border border-stone-200
        hover:border-stone-300 group focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
    >
      <span className="text-stone-700 text-sm md:text-base leading-relaxed">{text}</span>
    </button>
  );
}
