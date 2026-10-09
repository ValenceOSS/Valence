import { useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { DiscoverSearchFieldProps } from './DiscoverSearchField.types';
import { say } from '@ValenceI18n/say';

/**
 * Discover's own search, at the top of it: the catalogues searched for something to request, the
 * words sent on once they are entered.
 *
 * @param query - The words being searched for, or nothing.
 * @param onSearch - Told the words to search for.
 */
const DiscoverSearchField = ({ query, onSearch }: DiscoverSearchFieldProps) => {
  const [typed, setTyped] = useState(query);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();

        if (typed.trim() !== '') {
          onSearch(typed.trim());
        }
      }}
      className="w-full sm:max-w-md"
    >
      <TextField
        label={say('screens.requestsPage.searchDiscover')}
        isLabelHidden
        type="search"
        isPill
        value={typed}
        onValueChange={setTyped}
        placeholder={say('screens.requestsPage.findSomethingToRequest')}
        icon={<Icon of={SearchIcon} size={16} tone="muted" />}
      />
    </form>
  );
};

DiscoverSearchField.displayName = 'DiscoverSearchField';

export { DiscoverSearchField };
