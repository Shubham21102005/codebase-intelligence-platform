import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center">
              <span className="text-[#0d1117] font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-semibold text-[#e6edf3]">
              Codebase Analyzer
            </span>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-[#e6edf3] hover:text-[#58a6ff] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#58a6ff] text-white rounded-md hover:bg-[#388bfd] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-[#e6edf3] mb-6">
              Understand Your Codebase
              <br />
              <span className="text-[#58a6ff]">with AI</span>
            </h1>
            <p className="text-xl text-[#8b949e] mb-8 max-w-2xl mx-auto">
              Index your repositories and chat with your code. Get instant
              answers about your codebase structure, functions, and more.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="px-6 py-3 bg-[#58a6ff] text-white rounded-md hover:bg-[#388bfd] transition-colors font-medium"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-[#21262d] text-[#e6edf3] rounded-md hover:bg-[#30363d] transition-colors border border-[#30363d] font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff] transition-colors">
              <div className="w-12 h-12 bg-[#1f6feb]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#58a6ff]"
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
              <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">
                Code Intelligence
              </h3>
              <p className="text-[#8b949e]">
                Advanced AI-powered analysis of your codebase using vector
                search and graph databases.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff] transition-colors">
              <div className="w-12 h-12 bg-[#1f6feb]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#58a6ff]"
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
              <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">
                Natural Language Chat
              </h3>
              <p className="text-[#8b949e]">
                Ask questions about your code in plain English and get detailed
                answers with code references.
              </p>
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 hover:border-[#58a6ff] transition-colors">
              <div className="w-12 h-12 bg-[#1f6feb]/10 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#58a6ff]"
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
              <h3 className="text-lg font-semibold text-[#e6edf3] mb-2">
                Lightning Fast
              </h3>
              <p className="text-[#8b949e]">
                Get instant answers powered by Qdrant vector search and Neo4j
                graph database.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-[#8b949e] text-sm">
            © 2025 Codebase Analyzer. Powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
