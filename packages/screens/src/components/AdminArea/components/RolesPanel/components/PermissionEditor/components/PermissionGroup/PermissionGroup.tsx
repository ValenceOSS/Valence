import type { PermissionGroupProps } from './PermissionGroup.types';
import { say } from '@ValenceI18n/say';

/**
 * One group of permissions as a card of its own, named above with how many of them the role holds,
 * so what a role can do reads at a glance without going through every switch.
 *
 * @param heading - What the permissions are about.
 * @param heldCount - How many of them the role holds.
 * @param totalCount - How many there are.
 * @param children - The permissions.
 */
const PermissionGroup = ({ heading, heldCount, totalCount, children }: PermissionGroupProps) => (
  <section className="flex flex-col gap-2">
    <header className="flex items-baseline justify-between gap-3 px-1">
      <h4 className="text-sm font-medium text-text-muted">{heading}</h4>
      <span className="text-xs tabular-nums text-text-muted">
        {say('common.doneOfTotal', {
          done: heldCount.toString(),
          total: totalCount.toString(),
        })}
      </span>
    </header>

    <ul className="flex flex-col divide-y divide-[var(--surface-line)] rounded-xl bg-[var(--surface-hover)] ring-1 ring-inset ring-[var(--surface-line)]">
      {children}
    </ul>
  </section>
);

PermissionGroup.displayName = 'PermissionGroup';

export { PermissionGroup };
