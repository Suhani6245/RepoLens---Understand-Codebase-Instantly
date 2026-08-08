# AI Module (Phase 3 — done)

- **geminiClient.ts** — configured `@google/genai` client (`gemini-3.6-flash`, the current GA stable model). The only place in the backend that calls Google's API. Requires `GEMINI_API_KEY`; throws a typed `AppError` if it's missing.
- **prompts.ts** — prompt templates + JSON response schemas for file explanation, architecture summary, and Ask AI. Each system instruction explicitly forbids reproducing large source blocks verbatim.
- **contextBuilder.ts** — for Ask AI: keyword-matches the question against parsed file paths/exports/function names, then expands each match one hop via **BFS** over the dependency graph so closely related files are included even without a direct keyword hit.

All three AI-backed services (`fileExplanationService`, `architectureSummaryService`, `questionAnsweringService`) go through `generateStructuredContent()` in `geminiClient.ts` so error handling and JSON parsing stay consistent.
