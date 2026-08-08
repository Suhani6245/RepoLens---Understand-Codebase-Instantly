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
