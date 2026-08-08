import { AdjacencyList } from "../graph/AdjacencyList";
import { ParsedFile } from "../parser/parseFile";
import {
  ArchitectureSummary,
  FileNode,
  RepositoryOverview,
} from "../types/repository";
import { AppError } from "../utils/AppError";

export interface StoredRepository {
  repositoryId: string;
  overview: RepositoryOverview;
  fileTree: FileNode;
  pathIndex: Map<string, FileNode>;
  dependencyGraph: AdjacencyList;
  parsedFileCache: Map<string, ParsedFile>;
  cyclesCache: string[][] | null;
  architectureCache: ArchitectureSummary | null;
  clonePath: string;
  createdAt: number;
}

/**
 * In-memory store, keyed by repositoryId, backed by a HashMap for O(1)
 * lookups. Intentionally simple for a portfolio-scale project — swapping
 * this for Redis/Postgres later only touches this file, since every
 * caller goes through get/set/delete below.
 *
 * Known limitation: state is lost on server restart and isn't shared
 * across multiple backend instances. Fine for a single Render web
 * service; noted as a future improvement in the README.
 */
class RepositoryStore {
  private readonly store = new Map<string, StoredRepository>();

  set(record: StoredRepository): void {
    this.store.set(record.repositoryId, record);
  }

  get(repositoryId: string): StoredRepository | undefined {
    return this.store.get(repositoryId);
  }

  getOrThrow(repositoryId: string): StoredRepository {
    const record = this.store.get(repositoryId);
    if (!record) {
      throw new AppError(
        `No analyzed repository found for id "${repositoryId}". It may have expired — try analyzing the repository again.`,
        "REPOSITORY_NOT_FOUND",
        404
      );
    }
    return record;
  }

  has(repositoryId: string): boolean {
    return this.store.has(repositoryId);
  }

  delete(repositoryId: string): void {
    this.store.delete(repositoryId);
  }
}

export const repositoryStore = new RepositoryStore();
