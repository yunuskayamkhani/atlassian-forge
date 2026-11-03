export type JiraResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type ForgeJira = {
  asUser: () => { requestJira: (route: unknown, init?: unknown) => Promise<JiraResponse> };
};

export async function loadForgeJira(): Promise<{
  api: ForgeJira;
  route: (strings: TemplateStringsArray, ...values: Array<string | number>) => unknown;
}> {
  const mod = await import('@forge/api');
  return {
    api: (mod as unknown as { default: ForgeJira }).default,
    route: (mod as unknown as { route: (strings: TemplateStringsArray, ...values: Array<string | number>) => unknown })
      .route
  };
}
