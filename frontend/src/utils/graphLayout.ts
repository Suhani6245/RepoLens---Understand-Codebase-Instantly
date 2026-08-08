import type { DependencyGraphEdge, DependencyGraphNode } from "@/types/repository";

export interface LayoutPosition {
  x: number;
  y: number;
}

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 120;

/**
 * Assigns each node a "level" via a BFS/Kahn's-algorithm-style topological
 * layering: nodes with no incoming edges start at level 0, and every other
 * node's level is one more than the deepest predecessor that has already
 * been placed. Nodes involved in a cycle (which never reach in-degree 0)
 * are appended at the end so every node still gets a position.
 */
export function computeLayeredLayout(
  nodes: DependencyGraphNode[],
  edges: DependencyGraphEdge[]
): Map<string, LayoutPosition> {
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outgoing.set(n.id, []);
  });

  edges.forEach((e) => {
    if (!outgoing.has(e.source) || !inDegree.has(e.target)) return;
    outgoing.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  });

  const level = new Map<string, number>();
  const queue: string[] = [];
  const remainingInDegree = new Map(inDegree);

  nodes.forEach((n) => {
    if (remainingInDegree.get(n.id) === 0) {
      level.set(n.id, 0);
      queue.push(n.id);
    }
  });

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentLevel = level.get(current) ?? 0;

    for (const neighbor of outgoing.get(current) ?? []) {
      level.set(neighbor, Math.max(level.get(neighbor) ?? 0, currentLevel + 1));
      const remaining = (remainingInDegree.get(neighbor) ?? 1) - 1;
      remainingInDegree.set(neighbor, remaining);
      if (remaining === 0) queue.push(neighbor);
    }
  }

  // Anything left (cycles) never hit in-degree 0 — place at level 0 too.
  const maxAssignedLevel = Math.max(0, ...Array.from(level.values()));
  nodes.forEach((n) => {
    if (!level.has(n.id)) level.set(n.id, maxAssignedLevel + 1);
  });

  const countPerLevel = new Map<number, number>();
  const positions = new Map<string, LayoutPosition>();

  nodes.forEach((n) => {
    const lvl = level.get(n.id) ?? 0;
    const row = countPerLevel.get(lvl) ?? 0;
    countPerLevel.set(lvl, row + 1);
  });

  const nextIndexByLevel = new Map<number, number>();
  nodes.forEach((n) => {
    const lvl = level.get(n.id) ?? 0;
    const row = nextIndexByLevel.get(lvl) ?? 0;
    nextIndexByLevel.set(lvl, row + 1);

    const levelCount = countPerLevel.get(lvl) ?? 1;
    const x = lvl * COLUMN_WIDTH;
    const y = (row - (levelCount - 1) / 2) * ROW_HEIGHT;
    positions.set(n.id, { x, y });
  });

  return positions;
}
