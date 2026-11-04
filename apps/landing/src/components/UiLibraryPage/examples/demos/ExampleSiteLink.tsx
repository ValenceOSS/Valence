import { Link } from '@ValenceUI/Link';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';

/**
 * A place on the site, opened by its address, for the site's bar and footer drawn as examples where
 * no router is listening.
 *
 * @param to - Where it goes.
 * @param className - How the bar or footer styles it.
 * @param children - What it says.
 * @param onClick - Called when it is followed.
 * @param onFocus - Called when it takes focus.
 * @param onPointerEnter - Called when a pointer rests on it.
 */
const ExampleSiteLink = ({
  to,
  className,
  children,
  onClick,
  onFocus,
  onPointerEnter,
}: InSiteLinkProps) => (
  <Link
    href={to}
    look="bare"
    className={className}
    {...(onClick === undefined ? {} : { onClick })}
    {...(onFocus === undefined ? {} : { onFocus })}
    {...(onPointerEnter === undefined ? {} : { onPointerEnter })}
  >
    {children}
  </Link>
);

ExampleSiteLink.displayName = 'ExampleSiteLink';

export { ExampleSiteLink };
