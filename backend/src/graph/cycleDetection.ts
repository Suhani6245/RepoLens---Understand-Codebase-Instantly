import { AdjacencyList } from "./AdjacencyList";

type Color = "white" | "gray" | "black";

/**
 * Detects circular imports using classic DFS three-color marking:
 *  - white: not yet visited
 *  - gray:  on the current recursion stack (being visited)
 *  - black: fully processed, no cycle through it
 *
 * Hitting a gray node while walking means we've found a back-edge, i.e. a
 * cycle. Each cycle is returned as the ordered list of file paths that form
 * the loop, starting and ending at the repeated node.
 */
export function detectCycles(graph: AdjacencyList): string[][] {
  const color = new Map<string, Color>();
  for (const node of graph.nodes()) color.set(node, "white");

  const cycles: string[][] = [];
  const pathStack: string[] = [];

  function visit(node: string): void {
    color.set(node, "gray");
    pathStack.push(node);

    for (const neighbor of graph.neighbors(node)) {
      const neighborColor = color.get(neighbor) ?? "white";

      if (neighborColor === "gray") {
        // Back-edge found: extract the cycle from the current path stack.
        const cycleStart = pathStack.indexOf(neighbor);
        const cycle = pathStack.slice(cycleStart).concat(neighbor);
        cycles.push(cycle);
      } else if (neighborColor === "white") {
        visit(neighbor);
      }
    }

    pathStack.pop();
    color.set(node, "black");
  }

  for (const node of graph.nodes()) {
    if (color.get(node) === "white") {
      visit(node);
    }
  }

  return cycles;
}
