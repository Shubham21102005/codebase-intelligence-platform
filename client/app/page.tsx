import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Image
              src="/brain-brainstorm-creative-svgrepo-com.svg"
              alt="CodePulse Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-semibold text-white">
              CodePulse
            </span>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-[#b4b4b4] hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#60a5fa] transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-1.5 text-sm font-medium text-[#3b82f6] bg-[#3b82f6]/10 rounded-full border border-[#3b82f6]/20">
                🚀 AI-Powered Code Intelligence
              </span>
            </div>
            <h1 className="text-7xl font-bold text-white mb-6 leading-tight">
              Chat with
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
                Any Codebase
              </span>
            </h1>
            <p className="text-xl text-[#b4b4b4] mb-10 max-w-3xl mx-auto leading-relaxed">
              Ask questions, explore functions, understand architecture—all through natural conversation.
              CodePulse transforms how you interact with code.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-semibold shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/40 text-lg"
              >
                Start Chatting Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a] font-semibold text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-40">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-[#b4b4b4] max-w-2xl mx-auto">
                Get started with CodePulse in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 hover:border-[#3b82f6]/30 transition-all">
                  <div className="absolute -top-4 left-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#1e40af] rounded-lg flex items-center justify-center shadow-lg shadow-[#3b82f6]/30">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Connect Your Repository
                    </h3>
                    <p className="text-[#b4b4b4] leading-relaxed">
                      Link your GitHub repository or upload your codebase.
                      CodePulse supports all major programming languages.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 hover:border-[#3b82f6]/30 transition-all">
                  <div className="absolute -top-4 left-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#1e40af] rounded-lg flex items-center justify-center shadow-lg shadow-[#3b82f6]/30">
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-3">
                      AI Analyzes & Indexes
                    </h3>
                    <p className="text-[#b4b4b4] leading-relaxed">
                      Our AI deeply analyzes your code structure, dependencies,
                      and relationships using advanced vector embeddings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 hover:border-[#3b82f6]/30 transition-all">
                  <div className="absolute -top-4 left-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3b82f6] to-[#1e40af] rounded-lg flex items-center justify-center shadow-lg shadow-[#3b82f6]/30">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Ask Questions, Get Answers
                    </h3>
                    <p className="text-[#b4b4b4] leading-relaxed">
                      Chat naturally with your codebase. Get instant answers
                      with exact file locations and code snippets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Powerful Features
              </h2>
              <p className="text-lg text-[#b4b4b4]">
                Everything you need to understand and navigate any codebase
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Natural Conversations
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Ask questions in plain English. No need to memorize file paths or function names.
                </p>
              </div>

              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Smart Search
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Semantic search powered by vector embeddings finds exactly what you need.
                </p>
              </div>

              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Code Context
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Get answers with exact file locations, line numbers, and relevant code snippets.
                </p>
              </div>

              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Lightning Fast
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Instant responses powered by Qdrant vector database and advanced caching.
                </p>
              </div>

              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Private & Secure
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Your code stays private. Enterprise-grade security and encryption built-in.
                </p>
              </div>

              <div className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <div className="w-12 h-12 bg-[#3b82f6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3b82f6]/20 transition-colors">
                  <svg
                    className="w-6 h-6 text-[#3b82f6]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Multi-Language Support
                </h3>
                <p className="text-[#b4b4b4] leading-relaxed">
                  Works with Python, JavaScript, TypeScript, Java, Go, and 20+ languages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/brain-brainstorm-creative-svgrepo-com.svg"
                alt="CodePulse Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-white">CodePulse</span>
            </div>
            <p className="text-center text-[#6b6b6b] text-sm">
              © 2025 CodePulse. Chat with any codebase, instantly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
