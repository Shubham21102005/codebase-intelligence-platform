const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type Repository = {
  id: string;
  user_id: string;
  owner: string;
  repo: string;
  branch: string;
  status: 'cloning' | 'ready' | 'error';
  collection_name: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type AskRequest = {
  repo_id: string;
  question: string;
};

export type AskResponse = {
  answer: string;
  sources: string[];
};

export type AnalyzeRequest = {
  repo_id: string;
};

export type AnalyzeResponse = {
  repo_id: string;
  status: string;
  message: string;
};

export async function analyzeRepository(repo_id: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_id }),
  });

  if (!response.ok) {
    throw new Error(`Failed to analyze repository: ${response.statusText}`);
  }

  return response.json();
}

export async function askQuestion(repo_id: string, question: string): Promise<AskResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_id, question }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to ask question');
  }

  return response.json();
}
