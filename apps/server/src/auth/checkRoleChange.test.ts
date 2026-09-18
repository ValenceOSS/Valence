import { describe, expect, it } from 'vitest';
import { checkRoleChange } from './checkRoleChange';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const holding = (...permissions: Permission[]) => new Set<Permission>(permissions);

describe('checkRoleChange', () => {
  it('allows a change to a role below the actor, granting what they hold', () => {
    expect(
      checkRoleChange({
        actorId: 'usr_actor',
        ownerId: 'usr_owner',
        actorHighestPosition: 200,
        actorPermissions: holding('account.roles', 'jobs.run'),
        targetPosition: 100,
        granting: ['jobs.run'],
      }),
    ).toBeNull();
  });

  describe('rank', () => {
    it('refuses a role above the actor', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 100,
          actorPermissions: holding('account.roles'),
          targetPosition: 200,
        }),
      ).toBe('outranked');
    });

    it('refuses a role at the actor’s own rank', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 200,
          actorPermissions: holding('account.roles'),
          targetPosition: 200,
        }),
      ).toBe('outranked');
    });

    it('refuses everything to somebody holding no role at all', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: null,
          actorPermissions: holding('account.roles'),
          targetPosition: 0,
        }),
      ).toBe('outranked');
    });
  });

  describe('granting what you do not hold', () => {
    it('refuses a permission the actor lacks', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 200,
          actorPermissions: holding('account.roles', 'jobs.run'),
          targetPosition: 100,
          granting: ['server.settings'],
        }),
      ).toBe('escalation');
    });

    it('refuses when only one of several is missing', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 200,
          actorPermissions: holding('account.roles', 'jobs.run'),
          targetPosition: 100,
          granting: ['jobs.run', 'server.backup'],
        }),
      ).toBe('escalation');
    });

    it('refuses somebody handing out administrator', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 200,
          actorPermissions: holding('account.roles'),
          targetPosition: 100,
          granting: ['administrator'],
        }),
      ).toBe('escalation');
    });

    it('allows granting nothing new, such as a rename', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 200,
          actorPermissions: holding('account.roles'),
          targetPosition: 100,
        }),
      ).toBeNull();
    });
  });

  describe('rank is checked before what is granted', () => {
    it('reports being outranked rather than the escalation underneath it', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 100,
          actorPermissions: holding('account.roles'),
          targetPosition: 300,
          granting: ['administrator'],
        }),
      ).toBe('outranked');
    });
  });

  describe('administrator', () => {
    it('may no longer edit a role at its own rank, which is how it rewrote its way up', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 300,
          actorPermissions: holding('administrator'),
          targetPosition: 300,
          granting: ['administrator'],
        }),
      ).toBe('outranked');
    });

    it('still holds every permission, so granting one below it is not an escalation', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 300,
          actorPermissions: holding('administrator'),
          targetPosition: 100,
          granting: ['server.settings', 'account.ban'],
        }),
      ).toBeNull();
    });

    it('is outranked by a role above it, the same as anybody else', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: 300,
          actorPermissions: holding('administrator'),
          targetPosition: 999,
          granting: ['server.settings', 'account.ban'],
        }),
      ).toBe('outranked');
    });

    it('is refused where it holds no position at all, since rank now applies to it', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: 'usr_owner',
          actorHighestPosition: null,
          actorPermissions: holding('administrator'),
          targetPosition: 0,
        }),
      ).toBe('outranked');
    });
  });

  describe('the owner', () => {
    it('may change any role, which is what keeps somebody able to', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_owner',
          ownerId: 'usr_owner',
          actorHighestPosition: 300,
          actorPermissions: holding('administrator'),
          targetPosition: 300,
          granting: ['administrator'],
        }),
      ).toBeNull();
    });
  });

  describe('a server that has recorded no owner', () => {
    it('gives nobody the exemption, and falls back to rank alone', () => {
      expect(
        checkRoleChange({
          actorId: 'usr_actor',
          ownerId: null,
          actorHighestPosition: 300,
          actorPermissions: holding('administrator'),
          targetPosition: 300,
        }),
      ).toBe('outranked');
    });
  });
});
