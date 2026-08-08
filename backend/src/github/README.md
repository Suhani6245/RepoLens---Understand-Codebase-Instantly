# GitHub Module (Phase 2)

This module will hold:

- **githubClient** — thin wrapper around the GitHub REST API (repo metadata: stars, forks, language, description).
- **repoCloner** — uses simple-git to shallow-clone the target repository into `CLONE_WORKSPACE_DIR`.
- **repositoryWalker** — DFS-based directory walk that builds the `FileNode` tree and a HashMap-based path index.

Intentionally left as a stub in Phase 1 (project setup).
