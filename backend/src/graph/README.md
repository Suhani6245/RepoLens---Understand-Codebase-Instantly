# Graph Engine (Phase 2)

This module will hold:

- **AdjacencyList** — a HashMap<string, Set<string>> based adjacency list representing file → imported-file edges.
- **traverseDFS / traverseBFS** — generic graph traversal utilities.
- **detectCycles** — DFS with a recursion-stack HashMap to find circular imports (white-gray-black marking).
- **impactAnalysis** — DFS over the reversed adjacency list to find every file transitively affected by a change to a given file.

Intentionally left as a stub in Phase 1 (project setup).
