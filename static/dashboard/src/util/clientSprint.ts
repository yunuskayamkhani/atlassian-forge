import type { ProjectMapping } from '../types/models';

export function clientSprintLabel(mapping?: ProjectMapping | null): string | null {
  if (!mapping || mapping.sprintMode === 'none' || !mapping.sprintMode) {
    return null;
  }
  if (mapping.sprintMode === 'active') {
    return mapping.sprintName
      ? `Showing sprint: ${mapping.sprintName} (active)`
      : 'Showing the active sprint only';
  }
  return mapping.sprintName ? `Showing sprint: ${mapping.sprintName}` : 'Showing the selected sprint only';
}
