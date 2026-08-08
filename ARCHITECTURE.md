# RepoLens — Architecture

## 1. System Overview

RepoLens is a two-service application:

```
┌─────────────────────┐         HTTPS / JSON          ┌──────────────────────┐
│   frontend (Vercel)  │  ───────────────────────────▶ │   backend (Render)    │
│  React + Vite + TS   │ ◀───────────────────────────  │  Express + TS         │
└─────────────────────┘                                └──────────┬───────────┘
                                                                   │
                                        ┌──────────────────────────┼──────────────────────────┐
                                        │                          │                          │
                                 ┌──────▼──────┐          ┌────────▼────────┐        ┌────────▼────────┐
                                 │ GitHub REST  │          │  simple-git      │        │  Gemini API      │
                                 │ (metadata)   │          │  (shallow clone) │        │  (explanations)  │
                                 └──────────────┘          └────────┬────────┘        └──────────────────┘
                                                                     │
                                                            ┌────────▼────────┐
                                                            │  Tree-sitter     │
                                                            │  (AST + imports) │
                                                            └────────┬────────┘
                                                                     │
                                                            ┌────────▼────────┐
                                                            │  Graph Engine    │
                                                            │  (DSA layer)     │
                                                            └─────────────────┘
```

The frontend never talks to GitHub or Gemini directly — every external call is
proxied and shaped by the backend, which keeps API keys server-side and lets
the backend attach repository context to AI requests.

## 2. Request Flow (happy path)

1. User pastes a GitHub URL on the landing page → `POST /api/analyze`.
2. Backend validates the URL, fetches repo metadata via the GitHub REST API,
   and shallow-clones the repo with `simple-git` into a scratch workspace.
3. `github/repositoryWalker` performs a **DFS** over the cloned directory,
   building a `FileNode` tree and a `HashMap<path, FileNode>` index for O(1)
   lookups.
4. `parser/` runs Tree-sitter over source files to extract imports/exports,
   which `graph/` uses to build an **adjacency list**
   (`HashMap<string, Set<string>>`) of file → imported-file edges.
5. The frontend renders the overview + folder explorer immediately, then
   lazily requests: `POST /api/explain` per opened file, `GET /api/graph/:id`
   for the dependency graph, `GET /api/repository/:id/architecture` for the
   summary, and `POST /api/question` for Ask AI.
6. AI-backed endpoints build a context payload from the graph/tree (never the
   full source) before calling Gemini, and instruct the model not to
   reproduce large code blocks.

## 3. DSA Usage Map

| Requirement          | Where                                   | Technique                                              |
|-----------------------|------------------------------------------|----------------------------------------------------------|
| Repository traversal | `backend/src/github/repositoryWalker`   | DFS over the filesystem tree                            |
| Dependency graph      | `backend/src/graph`                     | Adjacency list (`HashMap<string, Set<string>>`)          |
| Graph traversal       | `backend/src/graph`                     | DFS (impact analysis) + BFS (shortest dependency path)   |
| Cycle detection        | `backend/src/graph`                     | DFS with recursion-stack coloring                         |
| Impact analysis       | `backend/src/graph` + `dependencyGraphService` | DFS over the **reversed** adjacency list          |
| Fast lookups          | `backend/src/github`, `backend/src/parser` | HashMaps for file path, import specifier, and export lookups |

Nested-loop scans are avoided anywhere a HashMap or adjacency list lookup
does the same job in O(1)/O(V+E).

## 4. Layering Convention (backend)

`routes/` → `controllers/` → `services/` → (`graph/` | `parser/` | `github/` | `ai/`)

- **routes**: HTTP method + path + input validation only.
- **controllers**: translate `req`/`res` into service calls, no business logic.
- **services**: orchestration and business rules; the only layer allowed to
  call multiple domain modules together.
- **graph / parser / github / ai**: single-responsibility domain modules with
  no knowledge of Express.

All errors are typed `AppError`s with a `code` and `statusCode`, caught by a
single `errorHandler` middleware, so every API response — success or failure
— follows the same `{ success, data }` / `{ success, error }` envelope.

## 5. Build Phases

1. **Phase 1 (done):** folder structure, frontend app shell, backend app
   shell (Express, middleware, typed route/controller/service stubs),
   shared type contracts.
2. **Phase 2 (done):** GitHub REST integration, `simple-git` shallow
   cloning, DFS-based repository traversal, and the DSA graph engine
   (adjacency list, DFS/BFS, cycle detection, impact analysis) wired end
   to end via an in-memory repository store. Dependency edges come from a
   lightweight regex-based import extractor (`src/parser/importExtractor.ts`)
   — real, working edges today; upgraded to full Tree-sitter AST parsing in
   Phase 3, which also unlocks accurate exports/key-function extraction for
   the AI file explanations. No AI calls yet.
3. **Phase 3 (done):** Real Tree-sitter AST parsing (`src/parser/treeSitterLoader.ts`,
   `astAnalyzer.ts`) extracts imports/exports/function signatures for
   TS/TSX/JS/Python (with a regex fallback for unsupported languages),
   feeding both the dependency graph and the AI prompts. Gemini
   integration (`src/ai/`) via the current `@google/genai` SDK and the
   `gemini-3.6-flash` stable model powers file explanations, the
   architecture summary, and Ask AI — each grounded in real parsed facts
   and graph context (Ask AI's context is built by keyword-matching files
   and expanding one hop via **BFS** over the dependency graph) rather
   than letting the model see raw, unstructured source dumps.
4. **Phase 4 (done):** Frontend feature build-out — VS Code-style folder
   explorer, repository overview panel, AI file explanation panel,
   architecture summary panel, an interactive dependency graph (React
   Flow, with a client-side layered layout computed via Kahn's-algorithm-
   style BFS topological ordering, click-to-highlight connected files, and
   a circular-import warning banner), and a conversational Ask AI panel —
   plus toast notifications and skeleton/empty/error states throughout.
5. **Phase 5 (done):** Deployment configs (`render.yaml` blueprint,
   `frontend/vercel.json` SPA rewrite), MIT license, the final
   recruiter-facing `README.md`, and a small polish pass (recent
   repositories on the landing page, backed by `localStorage`). Flow
   Diagram Generator remains explicitly out of scope, per the original
   spec's v2/future-features list.

## 6. Deployment Topology

- **Frontend → Vercel**: static build (`vite build`), `VITE_API_BASE_URL`
  points at the Render backend URL.
- **Backend → Render**: Node web service, `npm run build && npm start`,
  environment variables set in the Render dashboard (`GEMINI_API_KEY`,
  `GITHUB_TOKEN`, `FRONTEND_ORIGIN`).
- No secrets are committed; both services read exclusively from environment
  variables (see each `.env.example`).
