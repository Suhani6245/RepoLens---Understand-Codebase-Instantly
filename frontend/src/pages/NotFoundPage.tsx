import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium text-accent-400">404</p>
      <h1 className="text-2xl font-semibold text-text-primary">
        Page not found
      </h1>
      <Link to="/" className="btn-secondary mt-2">
        Back to home
      </Link>
    </main>
  );
}
