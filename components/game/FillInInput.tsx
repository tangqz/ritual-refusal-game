'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface FillInInputProps {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
  fimPrompt: string;
  fimSuffix?: string;
  lang: 'en' | 'zh';
}

export function FillInInput({ placeholder, disabled, onSubmit, fimPrompt, fimSuffix, lang }: FillInInputProps) {
  const [value, setValue] = useState('');
  const [ghost, setGhost] = useState('');
  const [isFetchingGhost, setIsFetchingGhost] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ghostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => { resizeTextarea(); }, [value, resizeTextarea]);

  // Fetch ghost completion from FIM API
  const fetchGhost = useCallback(async (currentValue: string) => {
    if (!currentValue.trim()) { setGhost(''); return; }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetchingGhost(true);
    try {
      const res = await fetch('/api/fim-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${fimPrompt}\n${currentValue}`,
          suffix: fimSuffix || '',
          stop: ['\n'],
        }),
        signal: controller.signal,
      });

      if (!res.ok) { setGhost(''); return; }

      const reader = res.body?.getReader();
      if (!reader) { setGhost(''); return; }

      const decoder = new TextDecoder();
      let sseBuf = '';
      let completion = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuf += decoder.decode(value, { stream: true });
        const sseLines = sseBuf.split('\n');
        sseBuf = sseLines.pop() || '';

        for (const sseLine of sseLines) {
          if (!sseLine.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(sseLine.slice(6));
            if (evt.type === 'chunk' && evt.text) {
              completion += evt.text;
              setGhost(completion);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setGhost('');
    } finally {
      setIsFetchingGhost(false);
    }
  }, [fimPrompt, fimSuffix]);

  // Debounced ghost fetching
  useEffect(() => {
    if (!value.trim()) { setGhost(''); return; }
    if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    ghostTimerRef.current = setTimeout(() => {
      fetchGhost(value);
    }, 300);
    return () => {
      if (ghostTimerRef.current) clearTimeout(ghostTimerRef.current);
    };
  }, [value, fetchGhost]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleSend = () => {
    const finalText = value.trim();
    if (!finalText || disabled) return;
    onSubmit(finalText);
    setValue('');
    setGhost('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab: accept ghost completion
    if (e.key === 'Tab' && ghost) {
      e.preventDefault();
      const newValue = value + ghost;
      setValue(newValue);
      setGhost('');
    }
    // Enter (no shift): submit — only send what user actually typed (ghost only if accepted via Tab/click)
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit(value.trim());
      setValue('');
      setGhost('');
    }
    // Shift+Enter: newline — let default behaviour through
  };

  const handleGhostTap = () => {
    if (ghost) {
      const newValue = value + ghost;
      setValue(newValue);
      setGhost('');
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full p-3.5 pr-16 bg-white border border-stone-200 rounded-xl text-stone-700
            text-sm md:text-base placeholder:text-stone-300 focus:outline-none focus:border-amber-300
            disabled:opacity-40 transition-colors resize-none overflow-hidden"
          autoFocus
        />
        {/* Send button — bottom-right */}
        {value.trim() && (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center
              rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95
              disabled:opacity-30 transition-all shadow-sm"
            aria-label={lang === 'en' ? 'Send' : '发送'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13.5h12.17l-5.58 5.59L11 20.5l8-8.5-8-8.5-1.41 1.41 5.58 5.59H3v2z" />
            </svg>
          </button>
        )}
        {/* Ghost text overlay */}
        {ghost && (
          <div
            ref={ghostRef}
            className="absolute inset-0 flex items-start pointer-events-none p-3.5 pr-16 overflow-hidden"
            aria-hidden="true"
          >
            <span className="text-sm md:text-base whitespace-pre-wrap break-words">
              <span className="text-transparent">{value}</span>
              <span
                className="text-stone-300 cursor-pointer pointer-events-auto select-none"
                onClick={handleGhostTap}
                title={lang === 'en' ? 'Click to accept suggestion' : '点击接受建议'}
              >
                {ghost}
              </span>
            </span>
          </div>
        )}
      </div>
      {/* Hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-stone-400">
          <span className="text-stone-500 font-medium">
            {lang === 'en' ? 'Tab' : 'Tab键'}
          </span>
          {lang === 'en' ? ' or tap suggestion to accept · ' : '或点击补全文字应用 · '}
          <span className="text-stone-500 font-medium">Enter</span>
          {lang === 'en' ? ' to send' : ' 发送'}
        </span>
        {isFetchingGhost && (
          <span className="text-xs text-stone-300 animate-pulse">...</span>
        )}
      </div>
    </div>
  );
}
