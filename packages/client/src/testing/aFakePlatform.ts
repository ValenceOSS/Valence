import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import type { Platform } from '@ValenceClient/platform/Platform.types';

/**
 * A platform that keeps things in memory and answers the same way every time, for tests about what
 * the application does rather than about where a browser puts things.
 *
 * @param overrides - Anything a particular test wants to answer differently.
 * @returns Something to install.
 */
const aFakePlatform = (overrides: Partial<Platform> = {}): Platform => ({
  ...aStillPlatform(),
  describeThisClient: () => 'A test',
  ...overrides,
});

export { aFakePlatform };
