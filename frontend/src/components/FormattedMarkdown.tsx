'use client';

import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  // Split into paragraphs/blocks by double newline or single newline
  const blocks = content.split(/\n\n+/);

  const renderInlineFormatted = (text: string) => {
    // Split by **bold** or *italic* markdown syntax
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-bold text-ink dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-inkMuted">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className={`space-y-3 leading-relaxed text-xs text-ink dark:text-slate-200 ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check if block is a section header like **Header Title** or ### Header Title
        const isHeader = /^(\*\*|\#\#?\#?)\s*[^\n]+?(\*\*|$)/.test(trimmed) && !trimmed.includes('\n');
        if (isHeader) {
          const cleanHeading = trimmed.replace(/^[\#\*\s]+|[\#\*\s]+$/g, '');
          return (
            <h4 key={bIdx} className="font-heading font-bold text-sm text-tealPrimary dark:text-teal-400 pt-2 pb-0.5 border-b border-slate-200/50 dark:border-slate-800">
              {cleanHeading}
            </h4>
          );
        }

        // Check if lines in block start with bullet items (- or * or •)
        const lines = trimmed.split('\n');
        const hasBullets = lines.some((line) => /^\s*[\-\*\•]\s+/.test(line.trim()));

        if (hasBullets) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-4 list-disc marker:text-tealPrimary">
              {lines.map((line, lIdx) => {
                const isBullet = /^\s*[\-\*\•]\s+/.test(line.trim());
                if (isBullet) {
                  const cleanLine = line.trim().replace(/^[\-\*\•]\s+/, '');
                  return (
                    <li key={lIdx} className="leading-relaxed">
                      {renderInlineFormatted(cleanLine)}
                    </li>
                  );
                }
                return (
                  <p key={lIdx} className="leading-relaxed font-normal">
                    {renderInlineFormatted(line)}
                  </p>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph block
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInlineFormatted(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
