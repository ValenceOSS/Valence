import { useMemo, useState } from 'react';
import { SidebarLeftIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@ValenceUI/Icon';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { SidebarGroup } from '@ValenceUI/SidebarGroup';
import { cn } from '@ValenceUI/cn';
import type { SidebarProps } from './Sidebar.types';

const matches = (needle: string, haystack: string): boolean =>
  haystack.toLowerCase().includes(needle.trim().toLowerCase());

/**
 * The one column of destinations standing against the left edge of a full page — an admin area, an
 * account — grouped and foldable rather than a flat list, and reducible to icons for a page that
 * wants the width back. This is the sidebar the dialogs it replaces never had: those switched
 * sections with a row of tabs across the top, which is not a shape that scales to eleven of them.
 *
 * Filtering is by what a destination is called, not by anything inside it — for jumping to a distant
 * section by name on a rail long enough that scrolling it is slower than typing.
 *
 * @param label - What the sidebar is for, read out to anybody who cannot see it.
 * @param brand - The mark at the top, usually a link back out of this area entirely.
 * @param groups - The destinations, in groups.
 * @param value - Which destination is current.
 * @param onSelect - Told which destination was chosen.
 * @param isCollapsed - Whether the rail is showing icons only.
 * @param onCollapsedChange - Told when the fold toggle is pressed.
 * @param footer - What sits pinned below every group — sign out, a theme choice, an account face.
 * @param className - Extra classes for the caller's own layout.
 */
const Sidebar = ({
  label,
  brand,
  groups,
  value,
  onSelect,
  isCollapsed = false,
  onCollapsedChange,
  footer,
  className,
}: SidebarProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (query.trim() === '') {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => matches(query, item.label)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  return (
    <nav
      aria-label={label}
      className={cn(
        'valence-surface flex h-full flex-col gap-4 border-r border-[var(--surface-line)] py-4',
        isCollapsed ? 'w-[4.5rem] items-center px-2' : 'w-64 px-3',
        className,
      )}
    >
      <div
        className={cn('flex items-center gap-2', isCollapsed ? 'flex-col' : 'justify-between px-1')}
      >
        {brand === undefined ? null : (
          <div className={cn('flex min-w-0 items-center gap-2', isCollapsed ? '' : 'flex-1')}>
            {brand}
          </div>
        )}

        {onCollapsedChange === undefined ? null : (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            label={isCollapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            onClick={() => {
              onCollapsedChange(!isCollapsed);
            }}
          >
            <Icon of={SidebarLeftIcon} size={17} />
          </Button>
        )}
      </div>

      {isCollapsed ? null : (
        <TextField
          label="Search anything"
          isLabelHidden
          type="search"
          value={query}
          onValueChange={setQuery}
          placeholder="Search anything"
          icon={<Icon of={Search01Icon} size={15} />}
          size="sm"
        />
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {filtered.map((group, index) => (
          <SidebarGroup
            key={group.label ?? `group-${index.toString()}`}
            {...(group.label === undefined ? {} : { label: group.label })}
            items={group.items}
            value={value}
            onSelect={onSelect}
            isRailCollapsed={isCollapsed}
          />
        ))}
      </div>

      {footer === undefined ? null : (
        <div className={cn('flex flex-col gap-2 border-t border-[var(--surface-line)] pt-3')}>
          {footer}
        </div>
      )}
    </nav>
  );
};

Sidebar.displayName = 'Sidebar';

export { Sidebar };
