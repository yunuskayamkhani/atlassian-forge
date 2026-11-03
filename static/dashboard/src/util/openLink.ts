export async function openLink(url: string): Promise<void> {
  try {
    const { router } = await import('@forge/bridge');
    await router.open(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
