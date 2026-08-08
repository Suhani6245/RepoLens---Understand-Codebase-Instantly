const STORAGE_KEY = "repolens:recent-repositories";
const MAX_RECENT = 5;

export interface RecentRepository {
  owner: string;
  repo: string;
  repoUrl: string;
  analyzedAt: number;
}

export function getRecentRepositories(): RecentRepository[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentRepository[];
  } catch {
    return [];
  }
}

export function addRecentRepository(entry: Omit<RecentRepository, "analyzedAt">): void {
  try {
    const existing = getRecentRepositories().filter(
      (r) => !(r.owner === entry.owner && r.repo === entry.repo)
    );
    const updated = [{ ...entry, analyzedAt: Date.now() }, ...existing].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently,
    // this is a non-critical convenience feature.
  }
}
