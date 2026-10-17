import { Command } from 'cmdk';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Dialog } from '@ValenceUI/Dialog';
import { Icon } from '@ValenceUI/Icon';
import { Kbd } from '@ValenceUI/Kbd';
import { cn } from '@ValenceUI/cn';
import type { CommandPaletteProps } from './CommandPalette.types';
import { say } from '@ValenceI18n/say';

/**
 * A search box over a list of places to go, opened over the page and driven from the keyboard.
 *
 * The list is the caller's, not filtered here: what counts as a match is the caller's to say, so a
 * palette over a whole site's text and one over a short list of commands are the same component.
 * Arrow keys move through the results, Enter chooses one and Escape closes it.
 *
 * Built on cmdk, which is what shadcn's `command` is built on, and which owns the input and the
 * keyboard handling inside it.
 *
 * @param label - What the palette is for, read out when it opens.
 * @param isOpen - Whether it is showing.
 * @param onClose - Called when it should close.
 * @param query - What has been typed.
 * @param onQueryChange - Called as it is typed.
 * @param groups - The results, under their headings.
 * @param onSelect - Called with the id of the result chosen.
 * @param placeholder - What the empty field says.
 * @param emptyLabel - What to say when nothing matches.
 */
const CommandPalette = ({
  label,
  isOpen,
  onClose,
  query,
  onQueryChange,
  groups,
  onSelect,
  placeholder = say('common.search'),
  emptyLabel = say('common.nothingMatchesThat'),
}: CommandPaletteProps) => (
  <Dialog label={label} isOpen={isOpen} onClose={onClose} isInstant className="w-full sm:w-[34rem]">
    <Command shouldFilter={false} label={label} loop>
      <div className="flex items-center gap-2.5 border-b border-[var(--card-face-line)] px-4">
        <Icon of={SearchIcon} size={16} tone="muted" />

        <Command.Input
          autoFocus
          value={query}
          onValueChange={onQueryChange}
          placeholder={placeholder}
          className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
        />

        <Kbd keys={[say('ui.commandPalette.escape')]} size="sm" className="shrink-0" />
      </div>

      <Command.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-8 text-center text-sm text-text-muted">
          {emptyLabel}
        </Command.Empty>

        {groups.map((group) => (
          <Command.Group
            key={group.heading}
            heading={group.heading}
            className={cn(
              '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1',
              '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted',
            )}
          >
            {group.items.map((item) => (
              <Command.Item
                key={item.id}
                value={item.id}
                onSelect={() => {
                  onSelect(item.id);
                }}
                className={cn(
                  'flex h-9 cursor-pointer items-center justify-between gap-4 rounded-lg px-2.5 text-[0.8125rem] text-text',
                  'data-[selected=true]:bg-[var(--surface-hover)]',
                )}
              >
                <span className="truncate font-medium">{item.label}</span>

                {item.detail === undefined ? null : (
                  <span className="shrink-0 truncate text-xs text-text-muted">{item.detail}</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>

      <div className="flex items-center gap-4 border-t border-[var(--card-face-line)] px-4 py-2 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <Kbd keys={['↑', '↓']} size="sm" />
          {say('common.move')}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys={['↵']} size="sm" />
          {say('common.open')}
        </span>
      </div>
    </Command>
  </Dialog>
);

CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
