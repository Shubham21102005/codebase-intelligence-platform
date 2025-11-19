"use client";

import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CodeViewerProps = {
  content: string;
};

export default function CodeViewer({ content }: CodeViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && match && mounted) {
              const language = match[1];
              return (
                <div className="my-4 rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]">
                  <div className="bg-[#161616] px-4 py-3 border-b border-[#2a2a2a] flex justify-between items-center">
                    <span className="text-xs text-[#8b8b8b] font-mono">
                      {language}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(codeString);
                      }}
                      className="text-xs text-[#8b8b8b] hover:text-[#3b82f6] transition-colors flex items-center space-x-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy</span>
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
                      fontSize: 14,
                      lineNumbers: "on",
                      renderLineHighlight: "none",
                      scrollbar: {
                        vertical: "auto",
                        horizontal: "auto",
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      overviewRulerBorder: false,
                      automaticLayout: true,
                      wordWrap: "on",
                      padding: { top: 16, bottom: 16 },
                    }}
                    beforeMount={(monaco) => {
                      monaco.editor.defineTheme("custom-dark", {
                        base: "vs-dark",
                        inherit: true,
                        rules: [
                          { token: "comment", foreground: "6A9955" },
                          { token: "keyword", foreground: "C586C0" },
                          { token: "string", foreground: "CE9178" },
                          { token: "number", foreground: "B5CEA8" },
                          { token: "type", foreground: "4EC9B0" },
                          { token: "class", foreground: "4EC9B0" },
                          { token: "function", foreground: "DCDCAA" },
                          { token: "variable", foreground: "9CDCFE" },
                          { token: "constant", foreground: "4FC1FF" },
                          { token: "operator", foreground: "D4D4D4" },
                          { token: "delimiter", foreground: "D4D4D4" },
                        ],
                        colors: {
                          "editor.background": "#1a1a1a",
                          "editor.foreground": "#D4D4D4",
                          "editor.lineHighlightBackground": "#1f1f1f",
                          "editorLineNumber.foreground": "#6b6b6b",
                          "editorLineNumber.activeForeground": "#8b8b8b",
                          "scrollbarSlider.background": "#3b3b3b80",
                          "scrollbarSlider.hoverBackground": "#3b3b3baa",
                          "scrollbarSlider.activeBackground": "#3b3b3b",
                        },
                      });
                    }}
                    onMount={(editor) => {
                      editor.updateOptions({ theme: "custom-dark" });
                      const lineCount = editor.getModel()?.getLineCount() || 1;
                      const lineHeight = 20;
                      const maxHeight = 800;
                      const height = Math.min(lineCount * lineHeight + 32, maxHeight);
                      editor.layout({ height, width: 0 });
                    }}
                  />
                </div>
              );
            }

            return (
              <code
                className="px-2 py-1 bg-[#2a2a2a] rounded-lg text-[#e6edf3] font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold text-white mt-8 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-white mt-5 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-white mb-4 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-white mb-4 space-y-2 pl-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-white mb-4 space-y-2 pl-4">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-white ml-2">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[#3b82f6] pl-4 my-4 text-[#8b8b8b]">
              {children}
            </blockquote>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <div className="prose prose-invert max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}
