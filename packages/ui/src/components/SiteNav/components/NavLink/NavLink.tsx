import { Link } from '@ValenceUI/Link';
import { whereTo } from '@ValenceUI/SiteNav/whereTo';
import type { NavLinkProps } from './NavLink.types';

/**
 * A link in the bar: through the site's own link where the place is on the site the bar is on,
 * so it opens without reloading, and by its whole address in this same tab anywhere else.
 *
 * @param target - Where it goes.
 * @param here - Which site the bar is on.
 * @param InSiteLink - How that site links to one of its own pages.
 * @param className - How it looks.
 * @param children - What it says.
 * @param onClick - Told when it is followed.
 * @param onFocus - Told when it takes focus.
 * @param onPointerEnter - Told when the pointer comes over it.
 */
const NavLink = ({
  target,
  here,
  InSiteLink,
  className,
  children,
  onClick,
  onFocus,
  onPointerEnter,
}: NavLinkProps) => {
  const destination = whereTo(target, here);
  const handlers = {
    ...(onClick === undefined ? {} : { onClick }),
    ...(onFocus === undefined ? {} : { onFocus }),
    ...(onPointerEnter === undefined ? {} : { onPointerEnter }),
  };

  return destination.isOnSite ? (
    <InSiteLink to={destination.to} className={className} {...handlers}>
      {children}
    </InSiteLink>
  ) : (
    <Link href={destination.href} look="bare" opensHere className={className} {...handlers}>
      {children}
    </Link>
  );
};

NavLink.displayName = 'NavLink';

export { NavLink };
