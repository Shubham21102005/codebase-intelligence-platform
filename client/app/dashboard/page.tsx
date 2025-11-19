'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { analyzeRepository, deleteRepository, Repository } from '@/lib/api';
import Navbar from '@/components/navbar';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRepo, setNewRepo] = useState({
    githubUrl: '',
    branch: 'main',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
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
        .from('repos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepos(data || []);
    } catch (err: any) {
      console.error('Error loading repos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Extract owner and repo from GitHub URL
      const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = newRepo.githubUrl.match(urlPattern);

      if (!match) {
        throw new Error('Invalid GitHub URL. Format: https://github.com/owner/repo');
      }

      const owner = match[1];
      const repo = match[2].replace(/\.git$/, ''); // Remove .git suffix if present

      // Insert repo into database
      const { data, error } = await supabase
        .from('repos')
        .insert({
          user_id: user?.id,
          owner: owner,
          repo: repo,
          branch: newRepo.branch,
          github_url: newRepo.githubUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger analysis
      await analyzeRepository(data.id);

      setShowAddForm(false);
      setNewRepo({ githubUrl: '', branch: 'main' });
      loadRepos();
    } catch (err: any) {
      setError(err.message || 'Failed to add repository');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-[#3ecf8e]';
      case 'cloning':
        return 'text-[#fbbf24]';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-[#b4b4b4]';
    }
  };

  const handleDeleteRepo = async (repoId: string) => {
    setDeleting(true);
    try {
      await deleteRepository(repoId);
      setDeleteConfirm(null);
      loadRepos(); // Reload the list after deletion
    } catch (err: any) {
      console.error('Error deleting repo:', err);
      alert('Failed to delete repository: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cloning':
        return (
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
          <div className="text-[#b4b4b4]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Your Repositories
            </h1>
            <p className="text-[#b4b4b4]">
              Manage and chat with your indexed codebases
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-semibold shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/30"
          >
            + Add Repository
          </button>
        </div>

        {/* Add Repository Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-2xl w-full shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Add New Repository
                  </h2>
                  <p className="text-[#b4b4b4] text-sm">
                    Connect a GitHub repository to start chatting with your code
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-[#b4b4b4] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#3b82f6] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#3b82f6] mb-2">Important Information</h3>
                    <ul className="text-sm text-[#b4b4b4] space-y-1">
                      <li>⏱️ Analysis typically takes <span className="text-white font-medium">1-2 minutes</span></li>
                      <li>📊 Please limit repositories to <span className="text-white font-medium">under 100,000 lines of code</span></li>
                      <li>🔒 Your code is analyzed securely and kept private</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddRepo} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
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
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-xs text-[#6b6b6b]">
                    Enter the full GitHub URL (e.g., https://github.com/owner/repository)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
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
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#6b6b6b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3b82f6]/20"
                  >
                    {submitting ? 'Analyzing Repository...' : 'Add & Analyze'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                    className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a] font-semibold disabled:opacity-50"
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3b82f6]/10 mb-6">
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
            <h3 className="text-xl font-semibold text-white mb-2">
              No repositories yet
            </h3>
            <p className="text-[#b4b4b4] mb-6">
              Get started by adding your first repository to analyze
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-semibold shadow-lg shadow-[#3b82f6]/20"
            >
              + Add Your First Repository
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3b82f6]/50 transition-all hover:shadow-lg hover:shadow-[#3b82f6]/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {repo.owner}/{repo.repo}
                      </h3>
                      <span className="px-3 py-1 text-xs bg-[#0a0a0a] border border-[#2a2a2a] rounded-full text-[#b4b4b4] font-medium">
                        {repo.branch}
                      </span>
                    </div>
                    <div
                      className={`flex items-center space-x-2 ${getStatusColor(
                        repo.status
                      )}`}
                    >
                      {getStatusIcon(repo.status)}
                      <span className="text-sm font-semibold capitalize">
                        {repo.status}
                      </span>
                    </div>
                    {repo.error_message && (
                      <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        {repo.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    {repo.status === 'ready' && (
                      <Link
                        href={`/chat/${repo.id}`}
                        className="px-5 py-2.5 bg-[#3b82f6] text-white rounded-lg hover:bg-[#60a5fa] transition-all font-semibold text-sm shadow-lg shadow-[#3b82f6]/20 hover:shadow-[#3b82f6]/30"
                      >
                        Start Chat
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteConfirm(repo.id)}
                      className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-semibold text-sm"
                    >
                      Delete
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
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Delete Repository
                </h3>
              </div>

              <p className="text-[#b4b4b4] mb-4">
                Are you sure you want to delete this repository? This will permanently remove all associated data from:
              </p>
              <ul className="text-[#b4b4b4] mb-6 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  <span>Vector embeddings (Qdrant)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  <span>Graph data (Neo4j)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                  <span>Repository metadata (Supabase)</span>
                </li>
              </ul>

              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
                <p className="text-red-400 text-sm font-semibold">
                  ⚠️ This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeleteRepo(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Repository'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors border border-[#2a2a2a] font-semibold disabled:opacity-50"
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
