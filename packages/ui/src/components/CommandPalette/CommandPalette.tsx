import { Command } from 'cmdk';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Dialog } from '@ValenceUI/Dialog';
import { Icon } from '@ValenceUI/Icon';
import type { CommandPaletteProps } from './CommandPalette.types';

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
  placeholder = 'Search',
  emptyLabel = 'Nothing matches that.',
}: CommandPaletteProps) => (
  <Dialog label={label} isOpen={isOpen} onClose={onClose} className="w-full sm:w-[36rem]">
    <Command shouldFilter={false} label={label} loop>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Icon of={SearchIcon} size={18} tone="muted" />

        <Command.Input
          value={query}
          onValueChange={onQueryChange}
          placeholder={placeholder}
          className="h-14 w-full bg-transparent text-base text-text outline-none placeholder:text-text-muted"
        />
      </div>

      <Command.List className="max-h-[min(26rem,60vh)] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-text-muted">
          {emptyLabel}
        </Command.Empty>

        {groups.map((group) => (
          <Command.Group
            key={group.heading}
            heading={group.heading}
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted"
          >
            {group.items.map((item) => (
              <Command.Item
                key={item.id}
                value={item.id}
                onSelect={() => {
                  onSelect(item.id);
                }}
                className="flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-text transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
              >
                <span className="text-sm font-medium">{item.label}</span>

                {item.detail === undefined ? null : (
                  <span className="line-clamp-1 text-xs text-text-muted">{item.detail}</span>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command>
  </Dialog>
);

CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };
