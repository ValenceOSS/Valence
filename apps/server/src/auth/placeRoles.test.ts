import { describe, expect, it } from 'vitest';
import { placeRoles } from './placeRoles';

const ROLES = [
  { id: 'administrator', position: 300 },
  { id: 'manager', position: 200 },
  { id: 'member', position: 100 },
  { id: 'restricted', position: 0 },
];

const ranksOf = (placed: ReturnType<typeof placeRoles>) =>
  typeof placed === 'string' ? placed : Object.fromEntries(placed);

describe('placeRoles', () => {
  it('numbers every role from the bottom up for the owner', () => {
    expect(
      ranksOf(
        placeRoles({
          roles: ROLES,
          ids: ['manager', 'administrator', 'restricted', 'member'],
          isOwner: true,
          actorHighestPosition: null,
        }),
      ),
    ).toEqual({ manager: 3, administrator: 2, restricted: 1, member: 0 });
  });

  it('keeps the roles at or above the actor where they are, and their ranks with them', () => {
    expect(
      ranksOf(
        placeRoles({
          roles: ROLES,
          ids: ['administrator', 'manager', 'restricted', 'member'],
          isOwner: false,
          actorHighestPosition: 200,
        }),
      ),
    ).toEqual({ administrator: 300, manager: 200, restricted: 1, member: 0 });
  });

  it('lifts the fixed roles together when the rest would not fit beneath them', () => {
    expect(
      ranksOf(
        placeRoles({
          roles: [
            { id: 'top', position: 2 },
            { id: 'tied', position: 1 },
            { id: 'actor', position: 1 },
            { id: 'a', position: 0 },
            { id: 'b', position: 0 },
            { id: 'c', position: 0 },
          ],
          ids: ['top', 'tied', 'actor', 'c', 'b', 'a'],
          isOwner: false,
          actorHighestPosition: 1,
        }),
      ),
    ).toEqual({ top: 4, tied: 3, actor: 3, c: 2, b: 1, a: 0 });
  });

  it('refuses to move a role at or above the actor', () => {
    expect(
      placeRoles({
        roles: ROLES,
        ids: ['manager', 'administrator', 'member', 'restricted'],
        isOwner: false,
        actorHighestPosition: 200,
      }),
    ).toBe('outranked');
  });

  it('refuses to put a role above the actor', () => {
    expect(
      placeRoles({
        roles: ROLES,
        ids: ['administrator', 'member', 'manager', 'restricted'],
        isOwner: false,
        actorHighestPosition: 200,
      }),
    ).toBe('outranked');
  });

  it('lets somebody holding no role move nothing', () => {
    expect(
      placeRoles({
        roles: ROLES,
        ids: ['administrator', 'manager', 'restricted', 'member'],
        isOwner: false,
        actorHighestPosition: null,
      }),
    ).toBe('outranked');
  });

  it('refuses an order that leaves a role out, names one twice or names one not there', () => {
    const asked = { roles: ROLES, isOwner: true, actorHighestPosition: null };

    expect(placeRoles({ ...asked, ids: ['administrator', 'manager', 'member'] })).toBe('stale');
    expect(placeRoles({ ...asked, ids: ['administrator', 'manager', 'member', 'member'] })).toBe(
      'stale',
    );
    expect(placeRoles({ ...asked, ids: ['administrator', 'manager', 'member', 'somebody'] })).toBe(
      'stale',
    );
  });
});
