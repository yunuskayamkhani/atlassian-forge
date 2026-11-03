import { describe, expect, it } from 'vitest';
import { parseIsAdmin, parseProjectPage } from './access';

describe('parseIsAdmin', () => {
  it('returns true when ADMINISTER.havePermission is true', () => {
    expect(
      parseIsAdmin({
        permissions: { ADMINISTER: { havePermission: true } }
      })
    ).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(parseIsAdmin({ permissions: { ADMINISTER: { havePermission: false } } })).toBe(false);
    expect(parseIsAdmin(null)).toBe(false);
  });
});

describe('parseProjectPage', () => {
  it('maps project id, key, and name', () => {
    const page = parseProjectPage({
      startAt: 0,
      maxResults: 50,
      isLast: true,
      values: [{ id: '10000', key: 'SCRUM', name: 'Scrum board' }]
    });

    expect(page.projects).toEqual([{ id: '10000', key: 'SCRUM', name: 'Scrum board' }]);
    expect(page.isLast).toBe(true);
  });
});
