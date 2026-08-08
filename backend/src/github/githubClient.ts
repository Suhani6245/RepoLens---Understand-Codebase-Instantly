import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface GithubRepoMetadata {
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  defaultBranch: string;
  url: string;
}

interface GithubRepoApiResponse {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  html_url: string;
  owner: { login: string };
}

/**
 * Fetches public repository metadata from the GitHub REST API.
 * Uses GITHUB_TOKEN when present to raise the (otherwise very low)
 * unauthenticated rate limit — the token is never required for public repos.
 */
export async function fetchRepoMetadata(
  owner: string,
  repo: string
): Promise<GithubRepoMetadata> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoLens",
  };

  if (env.githubToken) {
    headers.Authorization = `Bearer ${env.githubToken}`;
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );
  } catch {
    throw new AppError(
      "Could not reach the GitHub API. Check your network connection and try again.",
      "REPOSITORY_NOT_FOUND",
      502
    );
  }

  if (response.status === 404) {
    throw new AppError(
      `Repository "${owner}/${repo}" was not found. Make sure it's public and the URL is correct.`,
      "REPOSITORY_NOT_FOUND",
      404
    );
  }

  if (response.status === 403) {
    throw new AppError(
      "GitHub API rate limit exceeded. Set GITHUB_TOKEN in the backend .env to raise the limit.",
      "REPOSITORY_NOT_FOUND",
      429
    );
  }

  if (!response.ok) {
    throw new AppError(
      `GitHub API returned an unexpected error (${response.status}).`,
      "REPOSITORY_NOT_FOUND",
      502
    );
  }

  const data = (await response.json()) as GithubRepoApiResponse;

  return {
    name: data.name,
    owner: data.owner.login,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    defaultBranch: data.default_branch,
    url: data.html_url,
  };
}
