# RepoLens

**AI-powered GitHub repository explainer.** Paste a public repo URL and RepoLens clones it, parses it with Tree-sitter, builds a real dependency graph, and uses Gemini to explain its architecture, files, and code flow — grounded in facts extracted from the actual source, not guesswork.

> Built as a portfolio project to demonstrate full-stack engineering (React/TypeScript frontend, Node/Express backend), applied data structures & algorithms (graphs, DFS/BFS, cycle detection), and practical LLM integration (grounded prompting, structured outputs, context retrieval).

---

## Features

| Feature | Description |
|---|---|
| **Repository Overview** | Name, description, owner, stars, forks, language, detected framework, file/folder counts, estimated architecture |
| **Folder Explorer** | VS Code–style expandable file tree, built from a DFS walk of the cloned repository |
| **AI File Explanation** | Purpose, responsibilities, key functions, imports, and exports for any file — grounded in a real Tree-sitter AST parse, not the raw source dumped at an LLM |
| **Architecture Summary** | Pattern, framework, authentication, database, API structure, state management, and folder organization |
| **Dependency Graph** | Every file is a node, every resolved import is an edge, rendered interactively with React Flow. Click a node to highlight everything connected to it. Circular imports are flagged automatically. |
| **Ask AI** | Ask questions in plain English ("Where is authentication implemented?"). Answers are grounded in a graph-aware context: keyword-matched files expanded one hop via BFS over the dependency graph. |

**Not yet implemented (see [Future Improvements](#future-improvements)):** Flow Diagram Generator (v2).

---

## Tech Stack

**Frontend** — React · TypeScript · Vite · Tailwind CSS · React Router · React Flow · Axios

**Backend** — Node.js · Express · TypeScript · GitHub REST API · simple-git · Tree-sitter (`web-tree-sitter` + prebuilt WASM grammars)

**AI** — Gemini API (`gemini-3.6-flash`) via `@google/genai`, called only from the backend

---

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system diagram, request flow, and the DSA-to-code mapping table. In short:

```
routes → controllers → services → (graph | parser | github | ai)
```

- **`github/`** — GitHub REST metadata + `simple-git` shallow cloning + a DFS-based repository walker
- **`parser/`** — real Tree-sitter AST parsing (imports/exports/function signatures), with a regex fallback for unsupported languages
- **`graph/`** — the DSA layer: a HashMap-backed adjacency list, DFS/BFS traversal, cycle detection (recursion-stack coloring), and impact analysis (DFS over the reversed graph)
- **`ai/`** — the only code that talks to Gemini; every prompt is grounded in parsed facts and forbidden from reproducing large source blocks verbatim

The frontend never calls GitHub or Gemini directly — everything is proxied and shaped by the backend, keeping API keys server-side.

---

## Installation

**Prerequisites:** Node.js 18+, npm, git

```bash
git clone <this-repo-url>
cd RepoLens

# Backend
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY (see below)
npm install
npm run dev             # http://localhost:4000

# Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`, paste a public GitHub repo URL, and click **Analyze**.

---

## Environment Variables

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default `4000`) | Port the Express server listens on |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_ORIGIN` | Yes | Allowed CORS origin — your frontend's URL |
| `GEMINI_API_KEY` | Yes | Powers file explanations, architecture summary, and Ask AI |
| `GITHUB_TOKEN` | No | Raises the GitHub API rate limit above 60 requests/hour |
| `CLONE_WORKSPACE_DIR` | No (default `/tmp/repolens`) | Where repositories are shallow-cloned during analysis |

**`frontend/.env`**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | The backend's base URL |

Never commit a real `.env` file — only the `.env.example` templates are tracked.

---

## Screenshots

> _Add screenshots here once deployed:_
> - `docs/screenshots/landing.png` — Landing page
> - `docs/screenshots/overview.png` — Repository overview + folder explorer
> - `docs/screenshots/graph.png` — Dependency graph with a node selected
> - `docs/screenshots/ask-ai.png` — Ask AI panel

---

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. In Render, **New → Blueprint**, point it at this repo (uses [`render.yaml`](./render.yaml)), or create a Web Service manually:
   - **Root directory:** `backend`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
3. Set the environment variables listed above (`GEMINI_API_KEY`, `GITHUB_TOKEN`, `FRONTEND_ORIGIN`) in the Render dashboard.
4. Note the resulting service URL (e.g. `https://repolens-backend.onrender.com`).

### Frontend → Vercel

1. Import this repo in Vercel.
2. **Root directory:** `frontend` (Vercel auto-detects Vite; [`vercel.json`](./frontend/vercel.json) adds the SPA rewrite React Router needs).
3. Set `VITE_API_BASE_URL` to your Render backend URL from above.
4. Deploy. Then go back to Render and set `FRONTEND_ORIGIN` to the resulting Vercel URL so CORS allows it.

---

## Future Improvements

Planned but intentionally out of scope for this build:

- **Flow Diagram Generator** (v2 — mentioned in the original project goal)
- Sequence Diagram Generator
- UML Generator
- Automatic README Generator (for the *analyzed* repository, not this one)
- Code Smell Detection
- Complexity Analyzer
- Security Scanner
- Dead Code Detection
- Automatic Documentation
- Test Generation
- VS Code Extension

Also worth noting as an honest limitation: the repository store is currently in-memory (see `backend/src/services/repositoryStore.ts`), so analyzed repositories don't survive a server restart and aren't shared across multiple backend instances. Swapping in Redis or Postgres is a self-contained change — every caller goes through that one file.

---

## License

[MIT](./LICENSE)
