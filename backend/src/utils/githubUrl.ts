import { AppError } from "./AppError";

export interface ParsedGithubUrl {
  owner: string;
  repo: string;
  cloneUrl: string;
}

const GITHUB_URL_PATTERN =
  /^https?:\/\/github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(\.git)?\/?$/;

/**
 * Validates a GitHub repository URL and extracts { owner, repo }.
 * Throws a typed AppError (rather than returning null) so callers in the
 * service layer don't need to re-check for a falsy result.
 */
export function parseGithubUrl(url: string): ParsedGithubUrl {
  const match = url.trim().match(GITHUB_URL_PATTERN);

  if (!match) {
    throw new AppError(
      "That doesn't look like a valid public GitHub repository URL (expected https://github.com/owner/repo).",
      "INVALID_REPO_URL",
      400
    );
  }

  const [, owner, repo] = match;
  return { owner, repo, cloneUrl: `https://github.com/${owner}/${repo}.git` };
}
