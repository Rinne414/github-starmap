// Accepts "octocat", "@octocat", "github.com/octocat", a profile or repo URL,
// or "octocat/repo", and returns the account name.

const LOGIN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

/** First path segments on github.com that are not accounts. */
const RESERVED = new Set([
  "about", "apps", "codespaces", "collections", "contact", "customer-stories", "dashboard", "enterprise",
  "events", "explore", "features", "issues", "login", "marketplace", "new", "notifications", "pricing",
  "pulls", "search", "security", "settings", "signup", "site", "sponsors", "stars", "topics", "trending",
]);

function pathSegments(input: string): string[] | null {
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (!/^(www\.)?github\.com$/i.test(url.hostname)) return null;
  return url.pathname.split("/").filter(Boolean);
}

export function parseGithubInput(raw: string): string | null {
  const input = raw.trim().replace(/^@/, "");
  if (!input) return null;

  let candidate: string | undefined;
  if (/github\.com/i.test(input)) {
    const segments = pathSegments(input);
    if (!segments || segments.length === 0) return null;
    // github.com/orgs/<name> and github.com/users/<name>
    candidate = segments[0] === "orgs" || segments[0] === "users" ? segments[1] : segments[0];
    if (candidate && RESERVED.has(candidate.toLowerCase())) return null;
  } else {
    candidate = input.split("/")[0];
  }

  candidate = candidate?.replace(/^@/, "");
  return candidate && LOGIN.test(candidate) ? candidate : null;
}
