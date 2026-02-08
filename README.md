# Codebase Intelligence Platform  

![GitHub repo size](https://img.shields.io/github/repo-size/Shubham21102005/codebase-intelligence-platform) ![License](https://img.shields.io/github/license/Shubham21102005/codebase-intelligence-platform) ![Python](https://img.shields.io/badge/python-3.11%2B-blue) ![Node](https://img.shields.io/badge/node-20%2B-success) ![FastAPI](https://img.shields.io/badge/FastAPI-0.121.2-009688) ![Next.js](https://img.shields.io/badge/Next.js-16.0.3-000000)  

**Tagline** – *Turn any codebase into an interactive knowledge assistant.*  

> **Demo**: https://codebase-intelligence-platform.vercel.app (demo hosted on Vercel)  
> **Issues**: https://github.com/Shubham21102005/codebase-intelligence-platform/issues  

---  

## Overview  

The **Codebase Intelligence Platform** (CIP) is a full‑stack application that lets developers ask natural‑language questions about a repository, receive AI‑generated answers, and explore code snippets directly in the browser. It combines a **FastAPI** backend (powered by LangChain, Google‑GenAI, OpenAI, Neo4j, MongoDB, etc.) with a **Next.js 16** frontend that features a chat UI, dashboard, and code viewer.  

- **Why CIP?**  
  - No need to manually search through files – ask *“How does the authentication flow work?”* and get a concise answer with highlighted source code.  
  - Supports multiple LLM providers (OpenAI, Google Gemini, etc.) and vector stores (Qdrant, MongoDB, Neo4j).  
  - Extensible architecture: plug‑in new analysis pipelines, storage back‑ends, or UI components.  

**Target audience** – software engineers, technical leads, and DevOps teams that need rapid insight into large or unfamiliar codebases.  

Current version: **v0.1.0** (development).

---  

## Features  

| Feature | Description | Status |
|---------|-------------|--------|
| **Natural‑language code Q&A** | Ask questions about functions, architecture, or design decisions; receive AI‑generated answers with inline code snippets. | ✅ Stable |
| **Chat‑style UI** | Real‑time conversational interface built with React, TailwindCSS, and Monaco editor for code rendering. | ✅ Stable |
| **Dashboard** | Overview of indexed projects, recent queries, and usage statistics. | ✅ Stable |
| **Multi‑LLM support** | Switch between OpenAI, Google Gemini, Anthropic, etc. via environment configuration. | ✅ Stable |
| **Vector store abstraction** | Store embeddings in Qdrant, MongoDB, Neo4j, or PostgreSQL. | ✅ Stable |
| **File upload & repo cloning** | Upload a zip or provide a Git URL; the backend automatically clones, parses, and indexes the code. | ✅ Stable |
| **Delete & re‑index** | Remove a project from the knowledge base or trigger a fresh re‑index. | ✅ Stable |
| **Role‑based authentication** | Supabase‑backed auth (email/password, OAuth). | ✅ Stable |
| **Extensible plugin system** | Add custom analysis pipelines (e.g., security scanning) via the `services/` package. | 🟡 Beta |
| **Docker & CI ready** | Dockerfiles for both client and server; GitHub Actions skeleton included. | 🟡 Beta |

---  

## Tech Stack  

| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | Next.js 16 (React 19) • TypeScript • TailwindCSS • @monaco-editor/react • Supabase JS SDK | Modern React framework with server‑side rendering, fast dev experience, and built‑in auth. |
| **Backend** | FastAPI • Python 3.11+ • Pydantic • SQLAlchemy • LangChain • LangGraph • Neo4j • Qdrant • MongoDB • Supabase (auth) | High‑performance async API, type‑safe data models, and powerful LLM orchestration. |
| **LLM Providers** | OpenAI, Google Generative AI, Anthropic (via LangChain) | Flexibility to choose the best model for cost/quality. |
| **Vector Stores** | Qdrant, MongoDB, Neo4j, PostgreSQL (via `postgrest`) | Pluggable similarity search back‑ends. |
| **Containerisation** | Docker (multi‑stage builds) | Consistent dev/prod environments. |
| **CI/CD** | GitHub Actions (placeholder) • Vercel (frontend) • Render/ Railway (backend) | Automated testing & deployment pipelines. |
| **Testing** | Pytest (backend) • Jest + React Testing Library (frontend) | Ensure reliability. |

---  

## Architecture  

```
repo/
├─ client/                # Next.js SPA
│   ├─ app/               # Pages (chat, dashboard, login, register)
│   ├─ components/        # Navbar, CodeViewer (Monaco)
│   └─ lib/               # Supabase client, API wrapper
│
├─ server/                # FastAPI micro‑service
│   ├─ app/
│   │   ├─ __init__.py
│   │   ├─ config.py      # Pydantic Settings (env vars)
│   │   ├─ models.py      # SQLAlchemy + Pydantic schemas
│   │   ├─ routes/        # /ask, /analyze, /delete
│   │   ├─ services/      # LangChain pipelines, vector store adapters
│   │   └─ utils/         # Helper functions (logging, file handling)
│   └─ main.py            # FastAPI entry point
│
├─ docker-compose.yml     # (optional) orchestrates client & server
└─ README.md
```

* **Client ↔ Server** – All UI interactions go through `/api/*` endpoints exposed by FastAPI. The client uses the thin wrapper `client/lib/api.ts` to handle auth tokens and request retries.  
* **Data Flow** –  
  1. User uploads a repo → server clones & parses → embeddings are generated → stored in the selected vector store.  
  2. Query → server retrieves relevant chunks → LLM generates answer → response sent back to UI.  

---  

## Getting Started  

### Prerequisites  

| Tool | Minimum version |
|------|-----------------|
| **Node** | 20.x |
| **npm** | 10.x (or `pnpm`/`yarn`) |
| **Python** | 3.11 |
| **Docker** (optional) | 24.x |
| **Supabase** account | – |
| **OpenAI / Google AI** API keys | – |

### Installation  

#### 1. Clone the repository  

```bash
git clone https://github.com/Shubham21102005/codebase-intelligence-platform.git
cd codebase-intelligence-platform
```

#### 2. Set up environment variables  

Create a `.env` file in the **server** directory (copy from the example).  

```dotenv
# server/.env
# FastAPI
APP_ENV=development
LOG_LEVEL=info

# Vector store (choose one)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_key

# LLM providers
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
GOOGLE_PROJECT_ID=your-gcp-project

# Supabase (auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Database (optional)
POSTGRES_URL=postgresql://user:pass@localhost:5432/cip
```

Create a `.env.local` file in the **client** directory for Supabase configuration:  

```dotenv
# client/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Install backend dependencies  

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### 4. Install frontend dependencies  

```bash
cd ../client
npm install   # or `pnpm install`
```

#### 5. Run the services  

**Backend (FastAPI)**  

```bash
cd ../server
uvicorn main:app --reload   # http://localhost:8000
```

**Frontend (Next.js)**  

```bash
cd ../client
npm run dev                 # http://localhost:3000
```

You should now be able to open `http://localhost:3000`, sign‑up via Supabase, and start uploading a repository.

### Docker (optional)  

A multi‑stage Dockerfile is provided for each component.

```bash
# Build & run both containers with Docker Compose
docker compose up --build
```

The API will be reachable at `http://localhost:8000/api` and the UI at `http://localhost:3000`.

---  

## Usage  

### 1. Upload / Index a Repository  

1. Click **“Add Project”** in the dashboard.  
2. Provide a **Git URL** or upload a **ZIP** file.  
3. Choose the **LLM** and **vector store** you want to use.  
4. Click **“Index”** – the server clones the repo, extracts source files, creates embeddings, and stores them.  

### 2. Ask a Question  

In the **Chat** view:  

```text
User: How does the JWT authentication flow work in `auth-context.tsx`?
```

The UI sends a POST request to `/api/ask`:

```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
        "project_id": "my-awesome-repo",
        "question": "How does the JWT authentication flow work?"
      }'
```

**Response**

```json
{
  "answer": "The JWT flow is handled by `auth-context.tsx` ...",
  "relevant_code": [
    {
      "file_path": "client/lib/auth-context.tsx",
      "snippet": "const token = await supabase.auth.getSession(); ..."
    }
  ]
}
```

The frontend renders the answer and highlights the code snippet using the Monaco editor.

### 3. Delete / Re‑index  

```bash
curl -X DELETE http://localhost:8000/api/delete \
  -H "Content-Type: application/json" \
  -d '{"project_id":"my-awesome-repo"}'
```

A fresh index can be triggered via the dashboard or by re‑uploading the repo.

---  

## API Documentation  

All endpoints are prefixed with **`/api`** and return JSON. The server enables CORS for any origin (development).  

| Method | Endpoint | Description | Request Body (JSON) | Response |
|--------|----------|-------------|---------------------|----------|
| `GET` | `/api/health` | Health check | – | `{ "status":"healthy", "mode":"modular" }` |
| `POST` | `/api/ask` | Answer a natural‑language question | `{ "project_id": "string", "question": "string" }` | `{ "answer": "string", "relevant_code": [{ "file_path": "string", "snippet": "string" }] }` |
| `POST` | `/api/analyze` | Run a custom analysis pipeline (e.g., security scan) | `{ "project_id": "string", "pipeline": "string" }` | `{ "status":"queued", "pipeline_id":"uuid" }` |
| `DELETE` | `/api/delete` | Remove a project from the vector store | `{ "project_id": "string" }` | `{ "deleted": true }` |
| `POST` | `/api/upload` | Upload a zip or provide a Git URL (multipart) | `multipart/form-data` (file or `git_url`) | `{ "project_id":"string", "status":"indexing" }` |

**Authentication** – All routes require a Supabase JWT passed as `Authorization: Bearer <token>`. The client automatically attaches the token; for manual `curl` calls, add the header.

---  

## Development  

### Backend  

```bash
# Run tests
cd server
pytest -vv
```

- **Code style** – `ruff` (or `flake8`) is configured via `pyproject.toml`.  
- **Debugging** – Use `uvicorn --reload` or attach VS Code debugger to the `main.py` process.  

### Frontend  

```bash
# Lint & format
npm run lint
npm run format   # (prettier)
```

- **Storybook** – Not yet integrated (planned for v0.2).  
- **Hot‑module replacement** – Enabled by default with `next dev`.  

### Adding a New LLM Provider  

1. Install the provider’s SDK (e.g., `pip install anthropic`).  
2. Create a new service class in `server/app/services/llm/`.  
3. Register it in `server/app/config.py` under `LLM_PROVIDERS`.  
4. Update the frontend settings UI to expose the new option.

---  

## Deployment  

### Backend (FastAPI)  

1. **Docker** – Build the image and push to a registry.  

```dockerfile
# server/Dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Environment** – Set the same `.env` variables in the host (Docker secrets, Kubernetes ConfigMaps, etc.).  
3. **Reverse proxy** – Recommended to place behind **Traefik** or **NGINX** for TLS termination.  

### Frontend (Next.js)  

Deploy to **Vercel**, **Render**, or any Node‑compatible host.

```bash
npm run build
npm start   # runs the compiled server
```

If using Docker:

```dockerfile
# client/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
```

### Scaling  

- **Stateless API** – Horizontal scaling via Kubernetes Deployments.  
- **Vector store** – Qdrant can be run as a clustered service; MongoDB/Neo4j have their own replication mechanisms.  
- **LLM calls** – Rate‑limit per‑user in `services/llm_rate_limiter.py` (uses `aiolimiter`).  

---  

## Contributing  

We welcome contributions! Please follow these steps:

1. **Fork** the repository and create a feature branch.  
2. **Install** the development environment (see *Getting Started*).  
3. **Run tests** and ensure they pass.  
4. **Write tests** for any new functionality.  
5. **Submit a Pull Request** with a clear description and reference to an issue.  

### Code of Conduct  

Please adhere to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

### Development Workflow  

| Step | Command |
|------|---------|
| Install pre‑commit hooks | `pre-commit install` |
| Run backend lint | `ruff check server` |
| Run frontend lint | `npm run lint` |
| Run all tests | `pytest && npm test` |

---  

## Troubleshooting  

| Problem | Solution |
|---------|----------|
| **CORS error** when calling `/api/*` from the client | Ensure the backend is running on the same host/port or update `allow_origins` in `main.py`. |
| **Supabase auth fails** | Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct and that the Supabase project allows email/password sign‑up. |
| **Embedding generation hangs** | Check that the vector store URL (`QDRANT_URL`, `MONGODB_URI`, etc.) is reachable and that the API key is valid. |
| **Docker containers exit immediately** | Look at container logs (`docker logs <container>`); most often a missing environment variable. |
| **Large repo indexing times out** | Increase the timeout in `services/indexer.py` or split the repo into smaller chunks. |

For further help, open an issue or join the discussion on GitHub Discussions.

---  

## Roadmap  

- **v0.2** – Add security‑scan pipeline (Bandit, Trivy) and results UI.  
- **v0.3** – Real‑time streaming answers via Server