export type AppStatus = {
  ok: true;
  name: string;
  generatedAt: string;
};

export function getAppStatus(): AppStatus {
  return {
    ok: true,
    name: 'Bitbucket Engineering Dashboard',
    generatedAt: new Date().toISOString()
  };
}
