import { simpleGit } from "simple-git";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

/**
 * Shallow-clones (depth 1, single branch) a public repository into
 * `${CLONE_WORKSPACE_DIR}/${repositoryId}` and returns the absolute path.
 */
export async function cloneRepository(
  cloneUrl: string,
  repositoryId: string
): Promise<string> {
  const destination = path.join(env.cloneWorkspaceDir, repositoryId);
  await fs.mkdir(env.cloneWorkspaceDir, { recursive: true });

  try {
    await simpleGit().clone(cloneUrl, destination, [
      "--depth",
      "1",
      "--single-branch",
    ]);
  } catch (err) {
    // Clean up a partial clone before surfacing the error.
    await fs.rm(destination, { recursive: true, force: true }).catch(() => {});

    throw new AppError(
      "Failed to clone the repository. It may be private, deleted, or unreachable.",
      "CLONE_FAILED",
      502
    );
  }

  return destination;
}

/**
 * Removes a previously cloned repository from disk.
 */
export async function removeClonedRepository(
  clonedPath: string
): Promise<void> {
  await fs.rm(clonedPath, { recursive: true, force: true }).catch(() => {});
}
