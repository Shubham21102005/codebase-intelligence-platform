"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { analyzeRepository, deleteRepository, Repository } from "@/lib/api";
import Navbar from "@/components/navbar";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRepo, setNewRepo] = useState({
    githubUrl: "",
    branch: "main",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadRepos();
    }
  }, [user]);

  const loadRepos = async () => {
    try {
      const { data, error } = await supabase
        .from("repos")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRepos(data || []);
    } catch (err: any) {
      console.error("Error loading repos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = newRepo.githubUrl.match(urlPattern);

      if (!match) {
        throw new Error(
          "Invalid GitHub URL. Format: https://github.com/owner/repo"
        );
      }

      const owner = match[1];
      const repo = match[2].replace(/\.git$/, "");

      const { data, error } = await supabase
        .from("repos")
        .insert({
          user_id: user?.id,
          owner: owner,
          repo: repo,
          branch: newRepo.branch,
          github_url: newRepo.githubUrl,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      await analyzeRepository(data.id);

      setShowAddForm(false);
      setNewRepo({ githubUrl: "", branch: "main" });
      loadRepos();
    } catch (err: any) {
      setError(err.message || "Failed to add repository");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-400";
      case "cloning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-[#8b8b8b]";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500/10 border-green-500/30";
      case "cloning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-[#1a1a1a] border-[#2a2a2a]";
    }
  };

  const handleDeleteRepo = async (repoId: string) => {
    setDeleting(true);
    try {
      await deleteRepository(repoId);
      setDeleteConfirm(null);
      loadRepos();
    } catch (err: any) {
      console.error("Error deleting repo:", err);
      alert("Failed to delete repository: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <div className="w-3 h-3 bg-green-400 rounded-full"></div>;
      case "cloning":
        return (
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        );
      case "error":
        return <div className="w-3 h-3 bg-red-400 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-[#8b8b8b] rounded-full"></div>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[#8b8b8b]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Your Repositories
            </h1>
            <p className="text-[#8b8b8b]">
              Manage and chat with your indexed codebases
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-[#3b82f6] text-white rounded-xl hover:bg-[#60a5fa] transition-all font-medium flex items-center space-x-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Add Repository</span>
          </button>
        </div>

        {/* Add Repository Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Add New Repository
                  </h2>
                  <p className="text-[#8b8b8b] text-sm">
                    Connect a GitHub repository to start chatting with your code
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-[#8b8b8b]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-[#3b82f6] mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white mb-2">
                      Important Information
                    </h3>
                    <ul className="text-sm text-[#8b8b8b] space-y-1">
                      <li>• Analysis typically takes 1-2 minutes</li>
                      <li>• The repository should be public</li>
                      <li>
                        • Please limit repositories to under 100,000 lines of
                        code
                      </li>
                      <li>• Your code is analyzed securely and kept private</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start space-x-3">
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

              <form onSubmit={handleAddRepo} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    GitHub Repository URL
                  </label>
                  <input
                    type="text"
                    value={newRepo.githubUrl}
                    onChange={(e) =>
                      setNewRepo({ ...newRepo, githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/facebook/react"
                    required
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#3b82f6] transition-all"
                  />
                  <p className="mt-2 text-xs text-[#6b6b6b]">
                    Enter the full GitHub URL (e.g.,
                    https://github.com/owner/repository)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={newRepo.branch}
                    onChange={(e) =>
                      setNewRepo({ ...newRepo, branch: e.target.value })
                    }
                    placeholder="main"
                    required
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#3b82f6] transition-all"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-[#3b82f6] text-white rounded-xl hover:bg-[#60a5fa] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Add & Analyze</span>
                        <svg
                          className="w-4 h-4"
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
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                    className="px-6 py-3 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a] font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Repository List */}
        {repos.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              No repositories yet
            </h3>
            <p className="text-[#8b8b8b] mb-8 max-w-md mx-auto leading-relaxed">
              Get started by adding your first repository to analyze and chat
              with your codebase
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-3 bg-[#3b82f6] text-white rounded-xl hover:bg-[#60a5fa] transition-all font-medium flex items-center space-x-2 mx-auto"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Your First Repository</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3b82f6]/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-[#8b8b8b]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {repo.owner}/{repo.repo}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-[#8b8b8b] font-medium">
                            {repo.branch}
                          </span>
                          <div
                            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusBgColor(
                              repo.status
                            )} ${getStatusColor(repo.status)}`}
                          >
                            {getStatusIcon(repo.status)}
                            <span className="capitalize">{repo.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {repo.error_message && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start space-x-3">
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{repo.error_message}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    {repo.status === "ready" && (
                      <Link
                        href={`/chat/${repo.id}`}
                        className="px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-medium text-sm flex items-center space-x-2"
                      >
                        <svg
                          className="w-4 h-4"
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
                        <span>Chat</span>
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(repo.id)}
                      className="px-5 py-2.5 bg-[#1a1a1a] text-[#8b8b8b] border border-[#2a2a2a] rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-medium text-sm flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-400"
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
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Delete Repository
                  </h3>
                  <p className="text-[#8b8b8b] text-sm mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-[#8b8b8b] mb-6 leading-relaxed">
                Are you sure you want to delete this repository? This will
                permanently remove all associated data including:
              </p>

              <ul className="text-[#8b8b8b] mb-6 space-y-2">
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#3b82f6] rounded-full"></div>
                  <span>Vector embeddings</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#3b82f6] rounded-full"></div>
                  <span>Graph data</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#3b82f6] rounded-full"></div>
                  <span>Repository metadata</span>
                </li>
              </ul>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeleteRepo(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete Repository</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a] font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
