"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { askQuestion, AskResponse, Repository } from "@/lib/api";
import Navbar from "@/components/navbar";
import CodeViewer from "@/components/code-viewer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
};

export default function ChatPage() {
  const { repoId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && repoId) {
      loadRepo();
    }
  }, [user, repoId]);

  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else if (lastMessage.role === "user") {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  const loadRepo = async () => {
    try {
      const { data, error } = await supabase
        .from("repos")
        .select("*")
        .eq("id", repoId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      if (data.status !== "ready") {
        setError("Repository is not ready for chat yet");
      }
      setRepo(data);
    } catch (err: any) {
      console.error("Error loading repo:", err);
      setError("Repository not found");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !repo) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await askQuestion(repo.id, input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[#b4b4b4]">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !repo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      {/* Repo Header - Fixed at top */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[#b4b4b4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {repo?.owner}/{repo?.repo}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-[#8b8b8b]">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] mb-6">
                <svg
                  className="w-8 h-8 text-[#3b82f6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Start a conversation
              </h3>
              <p className="text-[#8b8b8b] max-w-md mx-auto leading-relaxed">
                Ask questions about your code, request explanations, or explore
                your codebase with AI
              </p>
            </div>
          )}

          <div className="space-y-8">
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`flex gap-4 items-start ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                )}

                <div className={`flex ${message.role === "user" ? "max-w-2xl justify-end" : "flex-1"}`}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert max-w-none">
                      <CodeViewer content={message.content} />
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#8b8b8b] font-mono hover:border-[#3b82f6]/30 transition-colors cursor-pointer"
                              >
                                {source}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#3b82f6] text-white px-5 py-3 rounded-2xl">
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-[#3b82f6] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start space-x-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your codebase..."
                disabled={loading || repo?.status !== "ready"}
                className="w-full px-5 py-3.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim() || repo?.status !== "ready"}
              className="px-6 py-3.5 bg-[#3b82f6] text-white rounded-xl hover:bg-[#60a5fa] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
