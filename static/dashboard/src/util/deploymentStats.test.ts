import { describe, expect, it } from 'vitest';
import { filterDeploymentsByWindow } from './deploymentStats';
import type { Deployment } from '../types/models';

const deployments: Deployment[] = [
  {
    uuid: 'new',
    environment: 'Production',
    status: 'COMPLETED',
    commitHash: 'a',
    createdOn: '2026-11-19T10:00:00Z',
    webUrl: ''
  },
  {
    uuid: 'old',
    environment: 'Staging',
    status: 'COMPLETED',
    commitHash: 'b',
    createdOn: '2026-11-01T10:00:00Z',
    webUrl: ''
  }
];

describe('filterDeploymentsByWindow', () => {
  it('keeps only deployments in the selected date window', () => {
    expect(filterDeploymentsByWindow(deployments, { from: Date.parse('2026-11-18T00:00:00Z'), to: null }))
      .toEqual([deployments[0]]);
  });
});
