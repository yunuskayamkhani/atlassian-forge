import type { ProjectMapping } from '../types/models';

export function clientSprintLabel(mapping?: ProjectMapping | null): string | null {
  return mapping?.targetBranch ? `Showing destination branch: ${mapping.targetBranch}` : null;
}
