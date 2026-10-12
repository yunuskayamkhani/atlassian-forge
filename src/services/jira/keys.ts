const JIRA_KEY = /\b[A-Z][A-Z0-9]+-\d+\b/g;

export function extractJiraKeys(text: string): string[] {
  const matches = text.match(JIRA_KEY);
  return matches ? Array.from(new Set(matches)) : [];
}

export function itemMatchesSprint(keys: string[], allowed: Set<string>): boolean {
  return keys.some((key) => allowed.has(key));
}
