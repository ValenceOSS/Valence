import type { NavTarget } from '@ValenceLanding/components/LandingNav/LandingNav.types';

/**
 * Tells a page on this site apart from a link that leaves it.
 *
 * @param target - Where a nav entry goes.
 * @returns Whether the router can take it there.
 */
const isLocalTarget = <T extends NavTarget>(target: T): target is T & { to: string } =>
  'to' in target;

export { isLocalTarget };
