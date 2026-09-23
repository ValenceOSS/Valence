import type { SessionUser } from '@ValenceContracts/schemas/Session';

/**
 * Somebody signed in, to draw a screen against.
 *
 * @param overrides - Anything about them that matters to the test.
 * @returns Them.
 */
const aSessionUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: 'user-1',
  name: 'Dan',
  email: 'dan@example.com',
  emailVerified: true,
  image: null,
  role: 'user',
  twoFactorEnabled: false,
  ...overrides,
});

export { aSessionUser };
