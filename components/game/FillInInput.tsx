'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface FillInInputProps {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (text: string) => void;
  /** Prompt sent to FIM API for auto-completion */
  fimPrompt: string;
  /** Suffix for FIM (optional) */
  fimSuffix?: string;
  lang: 'en' | 'zh';
}

export function FillInInput({ placeholder, disabled, onSubmit, fimPrompt, fimSuffix, lang }: FillInInputProps) {
  const [value, setValue] = useState('');
  const [ghost, setGhost] = useState('');
  const [isFetchingGhost, setIsFetchingGhost] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ghostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch ghost completion from FIM API
  const fetchGhost = useCallback(async (currentValue: string) => {
    if (!currentValue.trim()) { setGhost(''); return; }

    // Abort any in-flight request
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
            } else if (evt.type === 'done') {
              // keep current ghost
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      // Aborted or network error — silently ignore
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab: accept ghost completion
    if (e.key === 'Tab' && ghost) {
      e.preventDefault();
      const newValue = value + ghost;
      setValue(newValue);
      setGhost('');
    }
    // Enter: submit
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      const finalText = (value + ghost).trim();
      onSubmit(finalText);
      setValue('');
      setGhost('');
    }
  };

  const handleGhostTap = () => {
    if (ghost) {
      const newValue = value + ghost;
      setValue(newValue);
      setGhost('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3.5 pr-20 bg-white border border-stone-200 rounded-xl text-stone-700
            text-sm md:text-base placeholder:text-stone-300 focus:outline-none focus:border-amber-300
            disabled:opacity-40 transition-colors"
          autoFocus
        />
        {/* Ghost text overlay */}
        {ghost && (
          <div
            className="absolute inset-0 flex items-center pointer-events-none px-3.5"
            aria-hidden="true"
          >
            <span className="text-sm md:text-base text-transparent">{value}</span>
            <span
              className="text-sm md:text-base text-stone-300 cursor-pointer pointer-events-auto select-none"
              onClick={handleGhostTap}
              title={lang === 'en' ? 'Tap to accept suggestion' : '点击接受建议'}
            >
              {ghost}
            </span>
          </div>
        )}
      </div>
      {/* Hint */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-xs text-stone-400">
          {lang === 'en' ? 'Type your response — ' : '输入你的回应 — '}
          <span className="text-stone-500 font-medium">
            {lang === 'en' ? 'Tab' : 'Tab键'}
          </span>
          {lang === 'en' ? ' to accept suggestion, ' : ' 接受建议，'}
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
