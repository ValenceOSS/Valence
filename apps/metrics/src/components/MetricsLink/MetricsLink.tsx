'use client';

import NextLink from 'next/link';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';

/**
 * Links the shared bar and footer to one of the statistics site's own pages without reloading it.
 *
 * @param props - Where to, how it looks, what it says and who to tell when it is used.
 */
const MetricsLink = ({ to, className, children, ...handlers }: InSiteLinkProps) => (
  <NextLink href={to} className={className} {...handlers}>
    {children}
  </NextLink>
);

MetricsLink.displayName = 'MetricsLink';

export { MetricsLink };
