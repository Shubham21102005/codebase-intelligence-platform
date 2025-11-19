'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { askQuestion, AskResponse, Repository } from '@/lib/api';
import Navbar from '@/components/navbar';
import CodeViewer from '@/components/code-viewer';

type Message = {
  id: string;
  role: 'user' | 'assistant';
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && repoId) {
      loadRepo();
    }
  }, [user, repoId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRepo = async () => {
    try {
      const { data, error } = await supabase
        .from('repos')
        .select('*')
        .eq('id', repoId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (data.status !== 'ready') {
        setError('Repository is not ready for chat yet');
      }
      setRepo(data);
    } catch (err: any) {
      console.error('Error loading repo:', err);
      setError('Repository not found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !repo) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await askQuestion(repo.id, input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      // Remove the user message if the request failed
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-[#8b949e]">Loading...</div>
      </div>
    );
  }

  if (error && !repo) {
    return (
      <div className="min-h-screen bg-[#0d1117]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-[#f85149]">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-[#58a6ff] text-white rounded-md hover:bg-[#388bfd] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Repo Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#e6edf3]">
                {repo?.owner}/{repo?.repo}
              </h1>
              <p className="text-sm text-[#8b949e] mt-1">
                Chat with your codebase using natural language
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-[#8b949e] hover:text-[#58a6ff] transition-colors text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-[#8b949e]"
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
                <h3 className="mt-2 text-sm font-medium text-[#e6edf3]">
                  No messages yet
                </h3>
                <p className="mt-1 text-sm text-[#8b949e]">
                  Start by asking a question about your codebase
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[#0d1117] font-bold text-sm">
                        A
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex-1 max-w-3xl ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-[#58a6ff] text-white'
                          : 'bg-[#0d1117] text-[#e6edf3] border border-[#30363d]'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <CodeViewer content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-[#8b949e] font-medium">
                          Sources:
                        </p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-[#58a6ff] font-mono"
                          >
                            {source}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-[#30363d] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[#e6edf3] font-bold text-sm">
                        U
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0d1117] font-bold text-sm">A</span>
                </div>
                <div className="flex-1">
                  <div className="inline-block px-4 py-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-[#8b949e] rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#30363d] p-4">
            {error && (
              <div className="mb-3 p-2 bg-[#f85149]/10 border border-[#f85149]/50 rounded-md text-[#f85149] text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your codebase..."
                disabled={loading || repo?.status !== 'ready'}
                className="flex-1 px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || repo?.status !== 'ready'}
                className="px-6 py-3 bg-[#58a6ff] text-white rounded-md hover:bg-[#388bfd] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
