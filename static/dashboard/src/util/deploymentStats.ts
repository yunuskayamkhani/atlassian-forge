import type { Deployment } from '../types/models';
import type { DateWindow } from './commitStats';

export function filterDeploymentsByWindow(
  deployments: Deployment[],
  window: DateWindow
): Deployment[] {
  return deployments.filter((deployment) => {
    const createdAt = new Date(deployment.createdOn).getTime();
    if (Number.isNaN(createdAt)) {
      return false;
    }
    if (window.from !== null && createdAt < window.from) {
      return false;
    }
    if (window.to !== null && createdAt > window.to) {
      return false;
    }
    return true;
  });
}
