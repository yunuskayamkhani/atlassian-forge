export const DASHBOARD_PROJECT_KEY = 'PICO';
export const DASHBOARD_WORKSPACE_SLUG = 'owaismasoodq3';
export const DASHBOARD_REPOSITORY_FULL_NAMES = [
  'owaismasoodq3/awc_bookingflow_web',
  'owaismasoodq3/awc_bookingflow_api'
] as const;

export function isAllowedRepositoryFullName(fullName: string): boolean {
  return (DASHBOARD_REPOSITORY_FULL_NAMES as readonly string[]).includes(fullName.toLowerCase());
}
