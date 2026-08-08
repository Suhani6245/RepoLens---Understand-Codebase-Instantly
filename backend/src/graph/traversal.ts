import { AdjacencyList } from "./AdjacencyList";

/**
 * Iterative depth-first traversal from `start`.
 * Returns every node reachable from `start`, in DFS visit order
 * (excludes `start` itself).
 */
export function traverseDFS(graph: AdjacencyList, start: string): string[] {
  const visited = new Set<string>([start]);
  const order: string[] = [];
  const stack: string[] = [start];

  while (stack.length > 0) {
    const current = stack.pop()!;

    // Push in reverse so neighbors are visited in insertion order.
    const neighbors = Array.from(graph.neighbors(current)).reverse();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        order.push(neighbor);
        stack.push(neighbor);
      }
    }
  }

  return order;
}

/**
 * Breadth-first traversal from `start`.
 * Returns every node reachable from `start`, in BFS visit order
 * (excludes `start` itself). Useful for "shortest dependency path" style
 * queries, where DFS order isn't meaningful.
 */
export function traverseBFS(graph: AdjacencyList, start: string): string[] {
  const visited = new Set<string>([start]);
  const order: string[] = [];
  const queue: string[] = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];

    for (const neighbor of graph.neighbors(current)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        order.push(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return order;
}
