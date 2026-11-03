export type LoadState = 'loading' | 'ready' | 'error' | 'empty';

export type AppStatus = {
  ok: true;
  name: string;
  generatedAt: string;
};

export type DataSourceStatus = {
  id: string;
  label: string;
  state: 'loaded' | 'unavailable' | 'pending';
};
