import { describe, expect, it } from 'vitest';
import { checkAccountAction } from './checkAccountAction';

const check = (options: {
  actorId?: string;
  actorHighestPosition?: number | null;
  targetHighestPosition?: number | null;
  targetId?: string;
  ownerId?: string | null;
}) =>
  checkAccountAction({
    actorId: options.actorId ?? 'usr_actor',
    actorHighestPosition:
      options.actorHighestPosition === undefined ? 200 : options.actorHighestPosition,
    targetId: options.targetId ?? 'usr_target',
    targetHighestPosition:
      options.targetHighestPosition === undefined ? 100 : options.targetHighestPosition,
    ownerId: options.ownerId === undefined ? 'usr_owner' : options.ownerId,
  });

describe('checkAccountAction', () => {
  it('allows acting on somebody below you', () => {
    expect(check({})).toBeNull();
  });

  describe('rank', () => {
    it('refuses somebody above you', () => {
      expect(check({ targetHighestPosition: 300 })).toBe('outranked');
    });

    it('refuses somebody at your own rank', () => {
      expect(check({ targetHighestPosition: 200 })).toBe('outranked');
    });

    it('allows acting on somebody holding no role at all', () => {
      expect(check({ targetHighestPosition: null })).toBeNull();
    });

    it('refuses an actor holding no role at all', () => {
      expect(check({ actorHighestPosition: null })).toBe('outranked');
    });

    it('refuses when neither holds a role, so nobody outranks nobody', () => {
      expect(check({ actorHighestPosition: null, targetHighestPosition: null })).toBe('outranked');
    });
  });

  describe('yourself', () => {
    it('refuses, whatever the ranks say', () => {
      expect(check({ targetId: 'usr_actor' })).toBe('self');
    });

    it('refuses the owner too, since that is the worst accident', () => {
      expect(check({ actorId: 'usr_owner', targetId: 'usr_owner' })).toBe('self');
    });

    it('is checked before rank, so the message names the real reason', () => {
      expect(check({ targetId: 'usr_actor', targetHighestPosition: 999 })).toBe('self');
    });
  });

  describe('the owner', () => {
    it('cannot be acted on by anybody, however senior they are', () => {
      expect(check({ targetId: 'usr_owner', actorHighestPosition: 999 })).toBe('owner');
    });

    it('may act on anybody, including an equal', () => {
      expect(
        check({ actorId: 'usr_owner', targetHighestPosition: 999, actorHighestPosition: 300 }),
      ).toBeNull();
    });

    it('is protected before rank is even read', () => {
      expect(check({ targetId: 'usr_owner', targetHighestPosition: null })).toBe('owner');
    });
  });

  describe('a server that has recorded no owner', () => {
    it('protects nobody in particular, and falls back to rank alone', () => {
      expect(check({ ownerId: null })).toBeNull();
      expect(check({ ownerId: null, targetHighestPosition: 200 })).toBe('outranked');
    });
  });

  describe('two administrators', () => {
    it('cannot act on each other, which is the escalation this closes', () => {
      expect(check({ actorHighestPosition: 300, targetHighestPosition: 300 })).toBe('outranked');
    });
  });
});
