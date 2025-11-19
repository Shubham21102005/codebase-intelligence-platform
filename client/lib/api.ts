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

export type StreamEvent = {
  type: 'sources' | 'content' | 'done' | 'error';
  data?: any;
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

export async function* askQuestionStream(
  repo_id: string,
  question: string
): AsyncGenerator<StreamEvent> {
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

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event: StreamEvent = JSON.parse(line);
            yield event;
          } catch (e) {
            console.error('Failed to parse stream event:', line, e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type DeleteResponse = {
  success: boolean;
  message: string;
  deleted_from: {
    supabase: boolean;
    qdrant: boolean;
    neo4j: boolean;
  };
};

export async function deleteRepository(repo_id: string): Promise<DeleteResponse> {
  const response = await fetch(`${API_BASE}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repo_id }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to delete repository');
  }

  return response.json();
}
