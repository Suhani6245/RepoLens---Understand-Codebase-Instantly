import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { isValidGithubUrl, parseGithubUrl } from "@/utils/githubUrl";
import { getRecentRepositories } from "@/utils/recentRepositories";

export default function LandingPage() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [recent] = useState(getRecentRepositories);

  function goToAnalysis(owner: string, repo: string, url: string) {
    navigate(`/analysis/${owner}/${repo}`, { state: { repoUrl: url } });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isValidGithubUrl(repoUrl)) {
      setUrlError("Enter a valid public GitHub repository URL.");
      return;
    }

    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) return;

    setUrlError(null);
    goToAnalysis(parsed.owner, parsed.repo, repoUrl);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl animate-fadeIn text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background-elevated px-3 py-1 text-xs text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          AI-powered repository intelligence
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          Understand any codebase
          <span className="block text-accent-400">before you write a line.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-text-secondary">
          RepoLens analyzes any public GitHub repository and explains its
          architecture, file structure, dependencies, and code flow — in
          seconds.
        </p>

        <Card className="mt-8 text-left">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5
                  text-text-primary placeholder:text-text-muted outline-none
                  focus:border-accent-600 focus:ring-2 focus:ring-accent-600/30"
              />
              {urlError && (
                <p className="mt-1.5 text-sm text-red-400">{urlError}</p>
              )}
            </div>
            <Button type="submit">Analyze</Button>
          </form>
        </Card>

        {recent.length > 0 && (
          <div className="mt-6 text-left">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              Recent
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={`${r.owner}/${r.repo}`}
                  onClick={() => goToAnalysis(r.owner, r.repo, r.repoUrl)}
                  className="rounded-full border border-border bg-background-elevated px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent-700 hover:text-text-primary"
                >
                  {r.owner}/{r.repo}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
