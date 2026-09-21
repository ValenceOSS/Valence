import { useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { AskableMusicTile } from '@ValenceScreens/components/RequestsPage/components/AskableMusicTile/AskableMusicTile';
import { Record as RecordIcon } from '@keyline-icons/react';
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
    return <Spinner isCentered label="Reading what music there is to ask for" />;
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
      {shelves.map((shelf) => (
        <section key={shelf.id} aria-label={shelf.title} className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-text">{shelf.title}</h2>

          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shelf.titles.map((title) => (
              <AskableMusicTile key={title.id} title={title} onAsk={onAsk} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

MusicDiscover.displayName = 'MusicDiscover';

export { MusicDiscover };
