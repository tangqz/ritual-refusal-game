'use client';

interface PsychologyNoteProps {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
  labelEn: string;
  labelZh: string;
  hideEn: string;
  hideZh: string;
  lang: 'en' | 'zh';
}

export function PsychologyNote({
  text,
  isExpanded,
  onToggle,
  labelEn,
  labelZh,
  hideEn,
  hideZh,
  lang,
}: PsychologyNoteProps) {
  return (
    <div className="mt-1">
      <button
        onClick={onToggle}
        className={`text-xs flex items-center gap-1 transition-colors ${
          isExpanded
            ? 'text-stone-500 hover:text-stone-700'
            : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <span>{isExpanded ? '🔽' : '💭'}</span>
        <span>{isExpanded ? (lang === 'en' ? hideEn : hideZh) : (lang === 'en' ? labelEn : labelZh)}</span>
      </button>
      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-amber-200 text-sm text-stone-500 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
}
