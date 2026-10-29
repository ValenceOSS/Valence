import { SITE_ADDRESSES } from '@ValenceCore/project/SITE_ADDRESSES';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';
import type { NavTarget } from '@ValenceUI/SiteNav.types';

type Destination = { isOnSite: true; to: string } | { isOnSite: false; href: string };

/**
 * Works out how a place in the bar is reached from the site the bar is on: a page on this site by
 * the site's own link, anywhere else by its whole address.
 *
 * @param target - Where a place in the bar goes.
 * @param here - Which site the bar is on.
 * @returns The path on this site, or the address to leave it for.
 */
const whereTo = (target: NavTarget, here: ValenceSite): Destination => {
  if ('href' in target) {
    return { isOnSite: false, href: target.href };
  }

  if (target.site === here) {
    return { isOnSite: true, to: target.path };
  }

  return {
    isOnSite: false,
    href: `${SITE_ADDRESSES[target.site]}${target.path === '/' ? '' : target.path}`,
  };
};

export { whereTo };
