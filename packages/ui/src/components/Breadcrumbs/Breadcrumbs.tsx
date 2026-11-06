import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { BreadcrumbsProps } from './Breadcrumbs.types';

/**
 * The trail from the top of a tree down to where somebody is, each step one press back up to it,
 * scrolling sideways rather than wrapping where the trail is long.
 *
 * @param label - What the trail is, read out, such as where you are.
 * @param crumbs - Each step, the top first.
 * @param onChoose - Told which step was pressed.
 * @param className - Extra classes for the caller's own layout.
 */
const Breadcrumbs = ({ label, crumbs, onChoose, className }: BreadcrumbsProps) => (
  <nav
    aria-label={label}
    className={cn('valence-rail flex min-w-0 items-center gap-0.5 overflow-x-auto', className)}
  >
    {crumbs.map((crumb, at) => (
      <span key={crumb.id} className="flex shrink-0 items-center gap-0.5">
        {at === 0 ? null : <Icon of={ChevronRightIcon} size={12} tone="muted" />}

        <Button
          variant="ghost"
          size="xs"
          {...(at === crumbs.length - 1 ? { 'aria-current': 'location' as const } : {})}
          onClick={() => {
            onChoose(crumb.id);
          }}
        >
          {crumb.label}
        </Button>
      </span>
    ))}
  </nav>
);

Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs };
