import { useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { DiscoverSearchFieldProps } from './DiscoverSearchField.types';
import { say } from '@ValenceI18n/say';

/**
 * Discover's own search, centred at the top of it: the catalogues searched for something to
 * request, the words sent on with the button beside the field or by pressing Enter.
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
      className="mx-auto flex w-full max-w-xl items-end gap-2"
    >
      <TextField
        label={say('screens.requestsPage.searchDiscover')}
        isLabelHidden
        type="search"
        size="lg"
        value={typed}
        onValueChange={setTyped}
        placeholder={say('screens.requestsPage.findSomethingToRequest')}
        className="min-w-0 flex-1"
      />

      <Button type="submit" variant="secondary" size="lg" disabled={typed.trim() === ''}>
        <Icon of={SearchIcon} size={16} />
        {say('common.search')}
      </Button>
    </form>
  );
};

DiscoverSearchField.displayName = 'DiscoverSearchField';

export { DiscoverSearchField };
