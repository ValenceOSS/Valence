import { Link } from '@tanstack/react-router';
import { ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import type { Neighbours } from '@ValenceDocs/content/findNeighbours';

const LINK_CLASSES =
  'flex flex-1 flex-col gap-1 rounded-xl border border-border p-4 transition-colors hover:bg-surface-raised';

/**
 * The links to the page before and the page after, at the foot of a page.
 *
 * @param previous - The page before, if there is one.
 * @param next - The page after, if there is one.
 */
const PageNeighbours = ({ previous, next }: Neighbours) => (
  <nav aria-label="Previous and next page" className="mt-16 flex gap-4">
    {previous === null ? (
      <span className="flex-1" />
    ) : (
      <Link to={previous.path} className={LINK_CLASSES}>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Icon of={ArrowLeftIcon} size={14} tone="muted" />
          Previous
        </span>
        <span className="font-medium text-text">{previous.title}</span>
      </Link>
    )}

    {next === null ? (
      <span className="flex-1" />
    ) : (
      <Link to={next.path} className={`${LINK_CLASSES} items-end text-right`}>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          Next
          <Icon of={ArrowRightIcon} size={14} tone="muted" />
        </span>
        <span className="font-medium text-text">{next.title}</span>
      </Link>
    )}
  </nav>
);

PageNeighbours.displayName = 'PageNeighbours';

export { PageNeighbours };
