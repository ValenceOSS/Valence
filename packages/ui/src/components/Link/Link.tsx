import { cn } from '@ValenceUI/cn';
import type { LinkProps } from './Link.types';

const LOOK =
  'rounded-sm font-medium text-text underline decoration-text/30 underline-offset-4 outline-none transition-colors hover:decoration-text focus-visible:ring-[3px] focus-visible:ring-ring';

const ELSEWHERE = /^https?:\/\//iu;

/**
 * The one place an `<a>` is written in Valence: a link a person can open, copy or open elsewhere
 * from their browser's own menu, as a button that opens an address cannot be. An address on another
 * site opens in a new tab, without handing it this page; anything else opens here.
 *
 * @param href - Where it goes.
 * @param children - What it says.
 * @param className - Extra classes for the caller's own layout.
 */
const Link = ({ href, children, className }: LinkProps) =>
  ELSEWHERE.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(LOOK, className)}>
      {children}
    </a>
  ) : (
    <a href={href} className={cn(LOOK, className)}>
      {children}
    </a>
  );

Link.displayName = 'Link';

export { Link };
