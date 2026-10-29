import { Link } from '@tanstack/react-router';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';

/**
 * Links the shared bar and footer to one of this site's own pages without reloading it.
 *
 * @param props - Where to, how it looks, what it says and who to tell when it is used.
 */
const LandingLink = ({ to, className, children, ...handlers }: InSiteLinkProps) => (
  <Link to={to} className={className} {...handlers}>
    {children}
  </Link>
);

LandingLink.displayName = 'LandingLink';

export { LandingLink };
