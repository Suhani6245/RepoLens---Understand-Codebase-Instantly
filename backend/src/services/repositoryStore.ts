import fs from "fs";
import path from "path";
import { AdjacencyList } from "../graph/AdjacencyList";
import { ParsedFile } from "../parser/parseFile";
import {
  ArchitectureSummary,
  FileNode,
  RepositoryOverview,
} from "../types/repository";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

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

interface PersistedRepositoryRecord
  extends Omit<StoredRepository, "pathIndex" | "parsedFileCache" | "dependencyGraph"> {
  pathIndex: [string, FileNode][];
  parsedFileCache: [string, ParsedFile][];
  dependencyGraph: ReturnType<AdjacencyList["toJSON"]>;
}

/**
 * Repository cache keyed by repositoryId. It persists to disk so the app keeps
 * working across backend restarts and cold starts instead of losing every
 * analyzed repository in memory.
 */
class RepositoryStore {
  private readonly store = new Map<string, StoredRepository>();
  private readonly persistencePath = path.join(
    env.cloneWorkspaceDir,
    ".repository-store.json"
  );

  constructor() {
    this.loadFromDisk();
  }

  private serializeRecord(record: StoredRepository): PersistedRepositoryRecord {
    return {
      ...record,
      pathIndex: Array.from(record.pathIndex.entries()),
      parsedFileCache: Array.from(record.parsedFileCache.entries()),
      dependencyGraph: record.dependencyGraph.toJSON(),
    };
  }

  private deserializeRecord(record: PersistedRepositoryRecord): StoredRepository {
    return {
      ...record,
      pathIndex: new Map(record.pathIndex),
      parsedFileCache: new Map(record.parsedFileCache),
      dependencyGraph: AdjacencyList.fromJSON(record.dependencyGraph),
    };
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(this.persistencePath)) {
        return;
      }

      const raw = fs.readFileSync(this.persistencePath, "utf-8");
      if (!raw.trim()) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedRepositoryRecord[];
      for (const record of parsed) {
        this.store.set(record.repositoryId, this.deserializeRecord(record));
      }
    } catch {
      // If the persisted cache is corrupt or unreadable, ignore it and keep the
      // live in-memory state intact.
    }
  }

  private persist(): void {
    try {
      fs.mkdirSync(path.dirname(this.persistencePath), { recursive: true });
      const payload = Array.from(this.store.values()).map((record) =>
        this.serializeRecord(record)
      );
      fs.writeFileSync(this.persistencePath, JSON.stringify(payload, null, 2));
    } catch {
      // Best effort persistence: when disk isn't available we still keep the
      // in-memory cache working for the current runtime.
    }
  }

  set(record: StoredRepository): void {
    this.store.set(record.repositoryId, record);
    this.persist();
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
    this.persist();
  }
}

export const repositoryStore = new RepositoryStore();
