import { Fragment, memo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { AShelf } from '@ValenceMobile/components/AShelf/AShelf';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ADiscoverHero } from '@ValenceMobile/components/TheSearch/components/ADiscoverHero/ADiscoverHero';
import { AStudiosRail } from '@ValenceMobile/components/TheSearch/components/AStudiosRail/AStudiosRail';
import { discoverHeroTitles } from '@ValenceClient/requests/discoverHeroTitles';
import type { DiscoveredProps } from './Discovered.types';
import { say } from '@ValenceI18n/say';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const STUDIOS_AFTER = 1;

/**
 * The top of Discover, the studios, and what is trending, popular and coming, a shelf each, for somebody looking for something to ask for.
 *
 * @param onAsk - Told which title somebody wants to see.
 * @param onSeeAll - Told somebody wants the whole of a shelf's list, to scroll through without end.
 */
const DiscoveredSection = ({ onAsk, onSeeAll }: DiscoveredProps) => {
  const discovered = useQuery(requestsQueries.discover());
  const colours = useTheColours();

  if (discovered.isPending) {
    return <ASpinner colour={colours.textMuted} />;
  }

  if (discovered.isError) {
    return <Words tone="danger">{say('common.thatCouldNotBeRead')}</Words>;
  }

  const shelves = discovered.data.shelves.filter((shelf) => shelf.titles.length > 0);
  const { studios } = discovered.data;

  return (
    <>
      <ADiscoverHero titles={discoverHeroTitles(discovered.data.shelves)} onAsk={onAsk} />

      {shelves.map((shelf, at) => (
        <Fragment key={shelf.id}>
          <AShelf
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

          {at !== STUDIOS_AFTER || studios.length === 0 || onSeeAll === undefined ? null : (
            <AStudiosRail
              studios={studios}
              onOpen={(studio) => {
                onSeeAll({ kind: 'film', list: 'popular', studio: studio.id }, studio.name);
              }}
            />
          )}
        </Fragment>
      ))}
    </>
  );
};

const Discovered = memo(DiscoveredSection);

Discovered.displayName = 'Discovered';

export { Discovered };
