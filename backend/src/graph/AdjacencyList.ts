/**
 * Adjacency list backed by a HashMap<string, Set<string>>.
 * Nodes are repository-relative file paths; an edge A -> B means "A imports B".
 */
export class AdjacencyList {
  private readonly adjacency = new Map<string, Set<string>>();

  addNode(node: string): void {
    if (!this.adjacency.has(node)) {
      this.adjacency.set(node, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    this.addNode(from);
    this.addNode(to);
    this.adjacency.get(from)!.add(to);
  }

  neighbors(node: string): Set<string> {
    return this.adjacency.get(node) ?? new Set();
  }

  nodes(): string[] {
    return Array.from(this.adjacency.keys());
  }

  edges(): { source: string; target: string }[] {
    const result: { source: string; target: string }[] = [];
    for (const [source, targets] of this.adjacency) {
      for (const target of targets) {
        result.push({ source, target });
      }
    }
    return result;
  }

  has(node: string): boolean {
    return this.adjacency.has(node);
  }

  toJSON(): { type: "AdjacencyList"; adjacency: Record<string, string[]> } {
    const adjacency: Record<string, string[]> = {};
    for (const [node, neighbors] of this.adjacency.entries()) {
      adjacency[node] = Array.from(neighbors);
    }

    return { type: "AdjacencyList", adjacency };
  }

  static fromJSON(input?: {
    type?: string;
    adjacency?: Record<string, string[]>;
  }): AdjacencyList {
    const graph = new AdjacencyList();
    if (!input?.adjacency) {
      return graph;
    }

    for (const [node, neighbors] of Object.entries(input.adjacency)) {
      graph.addNode(node);
      for (const neighbor of neighbors) {
        graph.addEdge(node, neighbor);
      }
    }

    return graph;
  }

  /**
   * Returns a new AdjacencyList with every edge reversed.
   * Used for impact analysis: "what depends on this file" is the
   * forward-graph question asked on the reversed graph.
   */
  reversed(): AdjacencyList {
    const reversedGraph = new AdjacencyList();
    for (const node of this.nodes()) {
      reversedGraph.addNode(node);
    }
    for (const { source, target } of this.edges()) {
      reversedGraph.addEdge(target, source);
    }
    return reversedGraph;
  }
}
