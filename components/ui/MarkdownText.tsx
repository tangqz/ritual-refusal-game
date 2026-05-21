'use client';
import React from 'react';

/** Render basic markdown: **bold**, *italic*, --- (hr), line breaks */
export function MarkdownText({ text }: { text: string }) {
  if (!text) return null;

  // Split by --- for horizontal rules
  const segments = text.split(/^---$/gm);

  return (
    <>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <hr className="my-2 border-stone-200" />}
          {renderInline(seg)}
        </React.Fragment>
      ))}
    </>
  );
}

function renderInline(text: string) {
  // Process **bold** and *italic*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > last) {
      parts.push(<span key={last}>{text.slice(last, match.index)}</span>);
    }
    if (match[2]) {
      // **bold**
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={match.index} className="bg-stone-100 px-1 rounded text-sm">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  // Remaining text
  if (last < text.length) {
    parts.push(<span key={last}>{text.slice(last)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
