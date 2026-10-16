import type { ChildAccountService } from './ChildAccountService';

/**
 * Which accounts are children, and whose, held in memory, so the routes can be exercised without a
 * database.
 *
 * @returns The service.
 */
const createMemoryChildAccountService = (): ChildAccountService => {
  const children = new Map<string, { ownerId: string; pinHash: string | null }>();

  return {
    list: (ownerId) =>
      Promise.resolve(
        [...children.entries()]
          .filter(([, child]) => child.ownerId === ownerId)
          .map(([userId, child]) => ({ userId, hasPin: child.pinHash !== null })),
      ),

    ownerOf: (userId) => Promise.resolve(children.get(userId)?.ownerId ?? null),

    adopt: (ownerId, userId) => {
      children.set(userId, { ownerId, pinHash: null });

      return Promise.resolve();
    },

    pinHashOf: (userId) => Promise.resolve(children.get(userId)?.pinHash ?? null),

    setPinHash: (userId, pinHash) => {
      const child = children.get(userId);

      if (child !== undefined) {
        children.set(userId, { ...child, pinHash });
      }

      return Promise.resolve();
    },
  };
};

export { createMemoryChildAccountService };
