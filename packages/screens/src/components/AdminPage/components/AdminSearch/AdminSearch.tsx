import { useEffect, useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CommandPalette } from '@ValenceUI/CommandPalette';
import { Icon } from '@ValenceUI/Icon';
import { Kbd } from '@ValenceUI/Kbd';
import { say } from '@ValenceI18n/say';
import { fuzzyScore } from '@ValenceCore/functions/fuzzyScore';
import { requestAdminCommand } from '@ValenceScreens/admin/pendingAdminCommand';
import { ADMIN_COMMANDS } from '@ValenceScreens/components/AdminArea/adminCommands';
import type { AdminSearchProps } from './AdminSearch.types';

const ACTION_PREFIX = 'do:';

const SHORTCUT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? ['⌘', 'K']
    : [say('common.controlKey'), 'K'];

/**
 * A way to every page of the admin area by name: a search bar at the head of the sidebar, or a
 * glass on its rail, that opens the command palette over the page, as Command or Control and K do
 * from anywhere in it, matching forgivingly and best first. A page is found by its name or the
 * group it sits in, and an
 * action — adding a download client, creating a webhook — by its name, wherever its page is: the
 * page opens and carries it out.
 *
 * @param sections - The admin area's pages, under the groups the sidebar shows them in.
 * @param isCompact - Whether the sidebar is folded to its rail, where only the glass fits.
 * @param onGo - Called with the page chosen.
 */
const AdminSearch = ({ sections, isCompact, onGo }: AdminSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const pageNames = new Map(
    sections.flatMap((section) => section.items.map((item) => [item.id, item.label] as const)),
  );
  const ranked = <Item extends { id: string; label: string }>(
    items: readonly (Item & { foundBy: string })[],
  ): Item[] =>
    items
      .map((item) => ({ item, score: query.trim() === '' ? 0 : fuzzyScore(query, item.foundBy) }))
      .filter(
        (found): found is { item: Item & { foundBy: string }; score: number } =>
          found.score !== null,
      )
      .sort((one, other) => other.score - one.score)
      .map(({ item }) => item);
  const actions = ranked(
    ADMIN_COMMANDS.filter((command) => pageNames.has(command.panel)).map((command) => ({
      id: `${ACTION_PREFIX}${command.id}`,
      label: command.label,
      detail: pageNames.get(command.panel) ?? '',
      foundBy: `${command.label} ${pageNames.get(command.panel) ?? ''}`,
    })),
  ).map(({ id, label, detail }) => ({ id, label, detail }));
  const pages = sections
    .map((section) => ({
      heading: section.label ?? say('screens.adminPage.adminSearch.general'),
      items: ranked(
        section.items.map((item) => ({
          id: item.id,
          label: item.label,
          foundBy: `${item.label} ${section.label ?? ''}`,
        })),
      ).map(({ id, label }) => ({ id, label })),
    }))
    .filter((group) => group.items.length > 0);
  const groups = [
    ...(actions.length === 0 ? [] : [{ heading: say('common.actions'), items: actions }]),
    ...pages,
  ];

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {isCompact ? (
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          label={say('screens.adminPage.adminSearch.searchTheAdminArea')}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <Icon of={SearchIcon} size={16} />
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setIsOpen(true);
          }}
          className="w-full justify-between pr-1.5 font-normal text-text-muted"
        >
          <span className="truncate">
            {say('screens.adminPage.adminSearch.searchTheAdminArea')}
          </span>
          <Kbd keys={SHORTCUT} size="sm" />
        </Button>
      )}

      <CommandPalette
        label={say('screens.adminPage.adminSearch.searchTheAdminArea')}
        isOpen={isOpen}
        onClose={close}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        placeholder={say('screens.adminPage.adminSearch.findAPage')}
        onSelect={(id) => {
          close();

          const command = ADMIN_COMMANDS.find((one) => `${ACTION_PREFIX}${one.id}` === id);

          if (command === undefined) {
            onGo(id);

            return;
          }

          requestAdminCommand(command.id);
          onGo(command.panel);
        }}
      />
    </>
  );
};

AdminSearch.displayName = 'AdminSearch';

export { AdminSearch };
