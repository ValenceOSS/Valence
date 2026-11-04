import { ArrowUpRight as ArrowUpRightIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import type { OpenOnSiteProps } from './OpenOnSite.types';

/**
 * A small arrow that opens the page of one of a title's ids on the site it belongs to, small enough
 * to sit inside the id's box or just after it.
 *
 * @param href - The page on the site.
 * @param label - What a reader hears, such as which site it opens.
 */
const OpenOnSite = ({ href, label }: OpenOnSiteProps) => (
  <Link
    href={href}
    look="bare"
    label={label}
    className="flex size-6 items-center justify-center rounded-md text-text-muted transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-active)] hover:text-text motion-reduce:transition-none"
  >
    <Icon of={ArrowUpRightIcon} size={14} />
  </Link>
);

OpenOnSite.displayName = 'OpenOnSite';

export { OpenOnSite };
