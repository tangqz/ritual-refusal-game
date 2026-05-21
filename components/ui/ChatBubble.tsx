'use client';
import clsx from 'clsx';
import { MarkdownText } from './MarkdownText';

interface ChatBubbleProps {
  content: string;
  isUser: boolean;
  avatar?: string;
  isContext?: boolean;
  wisdomIcon?: string;       // emoji to show as wisdom badge
  onWisdomClick?: () => void; // opens wisdom card popup
  children?: React.ReactNode; // psychology note or other expandable content
}

export function ChatBubble({ content, isUser, avatar, isContext, wisdomIcon, onWisdomClick, children }: ChatBubbleProps) {
  // Context messages: centered, dimmed, italic
  if (isContext) {
    return (
      <div className="flex justify-center mb-4">
        <div className="max-w-sm text-center text-stone-400/70 text-sm italic leading-relaxed px-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex w-full mb-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && avatar && <div className="mr-2 text-xl flex-shrink-0 flex items-end">{avatar}</div>}
      <div className="relative">
        <div className={clsx(
          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm md:text-base whitespace-pre-wrap',
          isUser
            ? 'bg-stone-800 text-white rounded-br-md'
            : 'bg-white text-stone-700 rounded-bl-md border border-stone-200 shadow-sm'
        )}>
          <MarkdownText text={content} />
        </div>
        {wisdomIcon && (
          <button
            onClick={onWisdomClick}
            className="absolute -right-2 -top-2 w-7 h-7 bg-amber-100 hover:bg-amber-200 rounded-full flex items-center justify-center text-sm shadow-sm transition-colors"
            title="Wisdom card"
          >
            🦉
          </button>
        )}
        {children && (
          <div className={clsx(isUser ? 'text-right' : 'text-left')}>
            {children}
          </div>
        )}
      </div>
      {isUser && avatar && <div className="ml-2 text-xl flex-shrink-0 flex items-end">{avatar}</div>}
    </div>
  );
}
