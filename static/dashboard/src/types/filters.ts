export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export type PrStatusFilter = 'ALL' | 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';

export type DashboardFilters = {
  projectId: string | null;
  workspaceId: string | null;
  repositoryId: string | 'ALL';
  dateRange: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  prStatus: PrStatusFilter;
  developer: string | 'ALL';
  environment: string | 'ALL';
};

export const DEFAULT_FILTERS: DashboardFilters = {
  projectId: null,
  workspaceId: null,
  repositoryId: 'ALL',
  dateRange: '7d',
  prStatus: 'ALL',
  developer: 'ALL',
  environment: 'ALL'
};

export type FilterOption = {
  value: string;
  label: string;
};
