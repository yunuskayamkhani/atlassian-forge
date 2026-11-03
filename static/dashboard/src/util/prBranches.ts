const MAINLINE = /^(main|master|develop|trunk|production)$/i;

export function displayPrBranches(
  sourceBranch: string,
  targetBranch: string
): { source: string; destination: string } {
  const source = sourceBranch.trim();
  const destination = targetBranch.trim();

  if (MAINLINE.test(destination) && !MAINLINE.test(source)) {
    return { source: destination, destination: source };
  }

  if (MAINLINE.test(source) && !MAINLINE.test(destination)) {
    return { source, destination };
  }

  return {
    source: source || '—',
    destination: destination || '—'
  };
}
