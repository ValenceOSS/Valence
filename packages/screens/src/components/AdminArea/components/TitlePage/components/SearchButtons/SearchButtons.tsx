import { SearchList as SearchListIcon } from '@keyline-icons/react';
import { Search as SearchFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { nameSearchScope } from '@ValenceClient/requests/nameSearchScope';
import type { SearchButtonsProps } from './SearchButtons.types';
import { say } from '@ValenceI18n/say';

/**
 * The two searches for one season or episode of a title, as a pair of quiet buttons: search for it
 * automatically, or search by hand and pick — for a season, from its season packs.
 *
 * @param scope - The season, and the episode where it is one.
 * @param onSearch - Called to search for it automatically, where that can be done.
 * @param onInteractiveSearch - Called to search by hand, where that can be done.
 */
const SearchButtons = ({ scope, onSearch, onInteractiveSearch }: SearchButtonsProps) => {
  const name = nameSearchScope(scope);

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {onSearch === undefined ? null : (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePage.searchForName', { name })}
          onClick={() => {
            onSearch(scope);
          }}
        >
          <Icon of={SearchFilledIcon} size={15} />
        </Button>
      )}
      {onInteractiveSearch === undefined ? null : (
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.adminArea.titlePage.interactiveSearchForName', { name })}
          onClick={() => {
            onInteractiveSearch(scope);
          }}
        >
          <Icon of={SearchListIcon} size={15} />
        </Button>
      )}
    </span>
  );
};

SearchButtons.displayName = 'SearchButtons';

export { SearchButtons };
