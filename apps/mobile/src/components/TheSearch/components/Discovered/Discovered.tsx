import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { DiscoveredProps } from './Discovered.types';
import { say } from '@ValenceI18n/say';

/**
 * What is trending, popular and coming, a shelf each, for somebody looking for something to ask for.
 *
 * @param onAsk - Told which title somebody wants to see.
 * @param onSeeAll - Told somebody wants the whole of a shelf's list, to scroll through without end.
 */
const DiscoveredSection = ({ onAsk, onSeeAll }: DiscoveredProps) => {
  const discovered = useQuery(requestsQueries.discover());
  const colours = useTheColours();

  if (discovered.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (discovered.isError) {
    return <Words tone="danger">{say('phone.discovered.couldNotRead')}</Words>;
  }

  return discovered.data.shelves
    .filter((shelf) => shelf.titles.length > 0)
    .filter((shelf) => shelf.titles.every((title) => whatAPhoneAsksFor(title.kind)))
    .map((shelf) => (
      <AShelf
        key={shelf.id}
        title={shelf.title}
        {...(onSeeAll === undefined || shelf.browse === null
          ? {}
          : {
              onSeeAll: () => {
                if (shelf.browse !== null) {
                  onSeeAll(shelf.browse, shelf.title);
                }
              },
            })}
      >
        {shelf.titles.map((title) => (
          <ACatalogueCard key={`${title.kind}:${title.id}`} title={title} onAsk={onAsk} />
        ))}
      </AShelf>
    ));
};

const Discovered = memo(DiscoveredSection);

Discovered.displayName = 'Discovered';

export { Discovered };
