import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Terminal } from 'lucide-react';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy code:', e);
    }
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-[#292932] bg-[#0D0D10] shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#16161B] border-b border-[#222229] text-[11px] font-mono text-[#A1A1AA]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#8B7CFF]" />
          <span className="uppercase font-bold text-[#8B7CFF] tracking-wider text-[10px]">
            {lang || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#A1A1AA] hover:text-[#F4F4F5] bg-[#211C38] hover:bg-[#2C254B] px-2 py-0.5 rounded-md border border-[#49406F] transition-all cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-[#8B7CFF]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-emerald-300 selection:bg-[#211C38] selection:text-[#8B7CFF]">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`prose-lumina ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F4F4F5] mt-5 mb-3 tracking-tight border-b border-[#222229] pb-2 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-[#F4F4F5] mt-4 mb-2 tracking-tight flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-bold text-[#8B7CFF] mt-3 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-[#A1A1AA] mt-2 mb-1 uppercase tracking-wider">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm text-[#F4F4F5] leading-relaxed my-2">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-xs sm:text-sm text-[#E4E4E7]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-xs sm:text-sm text-[#E4E4E7]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-[#D4D4D8]">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#F4F4F5]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#E4E4E7]">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#8B7CFF] bg-[#16161B]/80 pl-3.5 py-2 my-2.5 rounded-r-xl text-xs sm:text-sm text-[#A1A1AA] italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-[#222229] my-4" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#292932]">
              <table className="w-full border-collapse text-xs text-left bg-[#16161B]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#1C1C23] text-[#8B7CFF] font-bold border-b border-[#292932]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 font-bold text-xs text-[#8B7CFF]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-b border-[#222229]/60 text-xs text-[#D4D4D8]">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B7CFF] hover:underline underline-offset-2 font-medium"
            >
              {children}
            </a>
          ),
          code: ({ inline, className, children, ...props }) => {
            const isCodeBlock = !inline && (className || String(children).includes('\n'));
            if (isCodeBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-[#1C1C23] border border-[#2A2A36] text-[#8B7CFF] font-mono text-[11px] sm:text-xs"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
