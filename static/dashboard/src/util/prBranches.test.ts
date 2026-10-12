import { describe, expect, it } from 'vitest';
import { displayPrBranches } from './prBranches';

describe('displayPrBranches', () => {
  it('shows main as source when Bitbucket merged a feature into main', () => {
    expect(displayPrBranches('feature/SCRUM-1-hull-trains', 'main')).toEqual({
      source: 'main',
      destination: 'feature/SCRUM-1-hull-trains'
    });
  });

  it('keeps main as source when Bitbucket already has that order', () => {
    expect(displayPrBranches('main', 'feature/SCRUM-2-testing')).toEqual({
      source: 'main',
      destination: 'feature/SCRUM-2-testing'
    });
  });

  it('leaves two feature branches in Bitbucket order', () => {
    expect(displayPrBranches('feature/a', 'feature/b')).toEqual({
      source: 'feature/a',
      destination: 'feature/b'
    });
  });
});
