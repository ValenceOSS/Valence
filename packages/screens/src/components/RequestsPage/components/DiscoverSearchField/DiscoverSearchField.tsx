import { useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { ScopedField } from '@ValenceUI/ScopedField';
import type { DiscoverSearchFieldProps } from './DiscoverSearchField.types';
import { say } from '@ValenceI18n/say';

/**
 * Discover's own search, centred at the top of it: the catalogues searched for something to
 * request, the words sent on with the button joined to the end of the field or by pressing Enter.
 *
 * @param query - The words being searched for, or nothing, which the field takes up whenever they
 *   change without the field being drawn again.
 * @param onSearch - Told the words to search for.
 */
const DiscoverSearchField = ({ query, onSearch }: DiscoverSearchFieldProps) => {
  const [typed, setTyped] = useState(query);
  const [searched, setSearched] = useState(query);

  if (query !== searched) {
    setSearched(query);
    setTyped(query);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();

        if (typed.trim() !== '') {
          onSearch(typed.trim());
        }
      }}
      className="mx-auto flex w-full max-w-xl"
    >
      <ScopedField
        label={say('screens.requestsPage.searchDiscover')}
        isLabelHidden
        size="lg"
        value={typed}
        onValueChange={setTyped}
        placeholder={say('screens.requestsPage.findSomethingToRequest')}
        submit={{ label: say('common.search'), icon: SearchIcon, isDisabled: typed.trim() === '' }}
        className="min-w-0 flex-1"
      />
    </form>
  );
};

DiscoverSearchField.displayName = 'DiscoverSearchField';

export { DiscoverSearchField };
