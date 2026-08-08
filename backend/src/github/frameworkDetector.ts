import { FileNode } from "../types/repository";

interface DetectionResult {
  framework: string;
  estimatedArchitecture: string;
}

const DEPENDENCY_SIGNATURES: { name: string; deps: string[] }[] = [
  { name: "Next.js", deps: ["next"] },
  { name: "Nuxt", deps: ["nuxt"] },
  { name: "React", deps: ["react"] },
  { name: "Vue", deps: ["vue"] },
  { name: "Angular", deps: ["@angular/core"] },
  { name: "SvelteKit", deps: ["@sveltejs/kit"] },
  { name: "Express", deps: ["express"] },
  { name: "NestJS", deps: ["@nestjs/core"] },
  { name: "Fastify", deps: ["fastify"] },
  { name: "Django", deps: ["django"] },
  { name: "Flask", deps: ["flask"] },
];

/**
 * Reads package.json (if present) from the path index and matches known
 * dependency names against DEPENDENCY_SIGNATURES. Falls back to a
 * folder-shape heuristic (presence of src/, api/, requirements.txt, etc.)
 * when no package.json is found.
 */
export function detectFramework(
  pathIndex: Map<string, FileNode>,
  packageJson: Record<string, unknown> | null
): DetectionResult {
  const deps = new Set<string>();

  if (packageJson) {
    for (const field of ["dependencies", "devDependencies"] as const) {
      const section = packageJson[field];
      if (section && typeof section === "object") {
        Object.keys(section as Record<string, unknown>).forEach((dep) =>
          deps.add(dep)
        );
      }
    }
  }

  const matched = DEPENDENCY_SIGNATURES.filter((sig) =>
    sig.deps.some((dep) => deps.has(dep))
  ).map((sig) => sig.name);

  if (matched.length > 0) {
    const hasFrontend = matched.some((name) =>
      ["React", "Vue", "Angular", "SvelteKit", "Next.js", "Nuxt"].includes(
        name
      )
    );
    const hasBackend = matched.some((name) =>
      ["Express", "NestJS", "Fastify", "Django", "Flask"].includes(name)
    );

    const architecture =
      hasFrontend && hasBackend
        ? "Full-stack (separate frontend + backend)"
        : hasFrontend
        ? "Client-side single-page application"
        : "Backend API service";

    return { framework: matched.join(" + "), estimatedArchitecture: architecture };
  }

  if (pathIndex.has("requirements.txt") || pathIndex.has("Pipfile")) {
    return {
      framework: "Python",
      estimatedArchitecture: "Backend / scripting project",
    };
  }

  return { framework: "Unknown", estimatedArchitecture: "Undetermined" };
}
