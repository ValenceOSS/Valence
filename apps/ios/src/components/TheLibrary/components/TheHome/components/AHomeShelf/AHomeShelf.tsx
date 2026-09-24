import { memo } from 'react';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { ACard } from '@ValencePhone/components/ACard/ACard';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { Button } from '@ValencePhone/components/Button/Button';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import type { AHomeShelfProps } from './AHomeShelf.types';

const RESUMING = 'resume';

/**
 * One shelf of the home page: what is coming up, or one of its rows of titles, drawn again only
 * when what it holds changes rather than whenever the page around it does.
 *
 * @param shelf - Which shelf.
 * @param upcoming - What is coming up, for the shelf of it.
 * @param progress - How far through each title somebody is.
 * @param today - Today, as a date, to say when an episode airs against.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 */
const AHomeShelfDrawn = ({
  shelf,
  upcoming,
  progress,
  today,
  onLookAt,
  onLookAtShow,
}: AHomeShelfProps) =>
  shelf.kind === 'comingUp' ? (
    <AShelf title="Coming up">
      {upcoming.map(({ show, episode }) => (
        <Button
          key={show.id}
          tone="bare"
          label={show.title}
          onPress={() => {
            onLookAtShow(show.libraryId, show.id);
          }}
        >
          <APoster
            title={show.title}
            artwork={onThisServer(`/api/media/${show.coverMediaId}/image/poster`)}
            note={`S${episode.seasonNumber.toString()} E${episode.episodeNumber.toString()} · ${describeAirDate(episode.airDate, today)}`}
          />
        </Button>
      ))}
    </AShelf>
  ) : (
    <AShelf title={shelf.rail.title}>
      {shelf.rail.items.map((media) => {
        const known = progress.get(media.id);

        return (
          <ACard
            key={media.id}
            media={media}
            asProgramme={shelf.rail.id !== RESUMING}
            watched={known === undefined ? 0 : watchedFraction(known)}
            onLookAt={onLookAt}
            onLookAtShow={onLookAtShow}
          />
        );
      })}
    </AShelf>
  );

const AHomeShelf = memo(AHomeShelfDrawn);

AHomeShelf.displayName = 'AHomeShelf';

export { AHomeShelf };
