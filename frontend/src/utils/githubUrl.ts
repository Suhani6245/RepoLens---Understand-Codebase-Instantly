export interface ParsedGithubUrl {
  owner: string;
  repo: string;
}

const GITHUB_URL_PATTERN =
  /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(\.git)?\/?$/;

/**
 * Validates and extracts { owner, repo } from a GitHub repository URL.
 * Returns null if the URL does not match the expected shape.
 */
export function parseGithubUrl(url: string): ParsedGithubUrl | null {
  const match = url.trim().match(GITHUB_URL_PATTERN);
  if (!match) return null;

  const [, owner, repo] = match;
  return { owner, repo };
}

export function isValidGithubUrl(url: string): boolean {
  return parseGithubUrl(url) !== null;
}
