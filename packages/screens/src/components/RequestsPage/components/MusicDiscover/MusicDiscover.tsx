import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { AskableMusicTile } from '@ValenceScreens/components/RequestsPage/components/AskableMusicTile/AskableMusicTile';
import { Record as RecordIcon } from '@keyline-icons/react';
import { Reveal } from '@ValenceUI/Reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { RevealGrid } from '@ValenceScreens/components/RequestsPage/components/RevealGrid/RevealGrid';
import { SHELF_STEP } from '@ValenceScreens/components/RequestsPage/SHELF_STEP';
import type { MusicDiscoverProps } from './MusicDiscover.types';

/**
 * Everything music there is to ask for, laid out as it is on the pages for films and shows: each of
 * the charts the server reads — the albums and the artists people are listening to — as a heading
 * over a grid, rather than as a rail to be scrolled along.
 *
 * @param onAsk - Told what was chosen, in the form the address knows it by.
 */
const MusicDiscover = ({ onAsk }: MusicDiscoverProps) => {
  const discovered = useQuery(requestsQueries.discover());

  if (discovered.isError) {
    return (
      <CouldNotRead
        what="What music there is to ask for"
        isTryingAgain={discovered.isFetching}
        onTryAgain={() => {
          void discovered.refetch();
        }}
      />
    );
  }

  if (discovered.data === undefined) {
    return <Spinner isPageCentered label="Reading what music there is to ask for" />;
  }

  const shelves = discovered.data.shelves.filter(
    (shelf) => shelf.titles.length > 0 && shelf.titles.every((title) => isMusicRequest(title.kind)),
  );

  if (shelves.length === 0) {
    return (
      <NothingHere
        of={RecordIcon}
        title="No music to ask for"
        detail="This server is not set up to read the music charts, or none could be reached."
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {shelves.map((shelf, at) => (
        <Reveal key={shelf.id} delay={at * SHELF_STEP}>
          <section aria-label={shelf.title} className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-text">{shelf.title}</h2>

            <RevealGrid label={shelf.title}>
              {shelf.titles.map((title, place) => (
                <RevealItem key={title.id} index={place}>
                  <AskableMusicTile title={title} onAsk={onAsk} />
                </RevealItem>
              ))}
            </RevealGrid>
          </section>
        </Reveal>
      ))}
    </div>
  );
};

MusicDiscover.displayName = 'MusicDiscover';

export { MusicDiscover };
