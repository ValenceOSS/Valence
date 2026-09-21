import { Link } from '@tanstack/react-router';
import type { AnchorHTMLAttributes } from 'react';

const LINK_CLASSES =
  'font-medium text-accent underline decoration-accent/30 underline-offset-4 transition-colors hover:decoration-accent';

/**
 * Draws a link written in a page: an address on this site goes through the router so it does not
 * reload, a heading anchor stays a plain anchor, and anything else opens in a new tab.
 *
 * @param href - Where it points.
 * @param children - What it says.
 */
const DocLink = ({ href, children }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (href === undefined || href.startsWith('#')) {
    return (
      <a href={href} className={LINK_CLASSES}>
        {children}
      </a>
    );
  }

  if (href.startsWith('/')) {
    return (
      <Link to={href} className={LINK_CLASSES}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
      {children}
    </a>
  );
};

DocLink.displayName = 'DocLink';

export { DocLink };
