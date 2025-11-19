'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type CodeViewerProps = {
  content: string;
};

export default function CodeViewer({ content }: CodeViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse content to extract code blocks with language info
  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match && mounted) {
              const language = match[1];
              return (
                <div className="my-4 rounded-md overflow-hidden border border-[#30363d]">
                  <div className="bg-[#161b22] px-4 py-2 border-b border-[#30363d] flex justify-between items-center">
                    <span className="text-xs text-[#8b949e] font-mono">
                      {language}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(codeString);
                      }}
                      className="text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <Editor
                    height="auto"
                    defaultLanguage={language}
                    value={codeString}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                      lineNumbers: 'on',
                      renderLineHighlight: 'none',
                      scrollbar: {
                        vertical: 'hidden',
                        horizontal: 'hidden',
                      },
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      overviewRulerBorder: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      padding: { top: 10, bottom: 10 },
                    }}
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme('github-dark', {
                        base: 'vs-dark',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': '#0d1117',
                          'editor.foreground': '#e6edf3',
                          'editor.lineHighlightBackground': '#161b22',
                          'editorLineNumber.foreground': '#6e7681',
                          'editorLineNumber.activeForeground': '#e6edf3',
                        },
                      });
                    }}
                    onMount={(editor) => {
                      // Auto-adjust height based on content
                      const lineCount = editor.getModel()?.getLineCount() || 1;
                      const lineHeight = 19;
                      const height = Math.min(lineCount * lineHeight + 20, 500);
                      editor.layout({ height, width: 0 }); // width 0 means auto
                    }}
                  />
                </div>
              );
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 bg-[#6e768166] rounded text-[#e6edf3] font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[#e6edf3] mt-6 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-[#e6edf3] mt-5 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-[#e6edf3] mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[#e6edf3] mb-4 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-[#e6edf3] mb-4 space-y-1 pl-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-[#e6edf3] mb-4 space-y-1 pl-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[#e6edf3] ml-2">{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58a6ff] hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#30363d] pl-4 my-4 text-[#8b949e] italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return <div className="prose prose-invert max-w-none">{renderMarkdown(content)}</div>;
}
