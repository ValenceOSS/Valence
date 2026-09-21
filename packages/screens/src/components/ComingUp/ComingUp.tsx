import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { describeAirDate } from '@ValenceCore/functions/describeAirDate';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import type { ComingUpProps } from './ComingUp.types';

/**
 * A row of the programmes in the library that have an episode still to come, soonest first, each
 * saying which episode it is and when it airs, so what is worth coming back for is on the front page
 * rather than something to remember.
 *
 * It says nothing at all where nothing is coming, or where the catalogue could not be asked, since
 * an empty row is noise on a page that is otherwise about what to watch.
 *
 * @param onOpenShow - Told which programme was chosen.
 */
const ComingUp = ({ onOpenShow }: ComingUpProps) => {
  const asked = useQuery(libraryQueries.comingUp());
  const coming = asked.data ?? [];

  if (coming.length === 0) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Rail title="Coming up" sizesCards cards="portrait" className="-mx-4 sm:-mx-6">
      {coming.map(({ show, episode }, at) => (
        <RevealItem key={show.id} index={at} className="shrink-0 snap-start">
          <MediaCard
            shape="poster"
            title={show.title}
            subtitle={`S${episode.seasonNumber.toString()} E${episode.episodeNumber.toString()} · ${describeAirDate(episode.airDate, today)}`}
            imageUrl={`/api/media/${show.coverMediaId}/image/poster`}
            onSelect={() => {
              onOpenShow(show.seriesId ?? show.id);
            }}
          />
        </RevealItem>
      ))}
    </Rail>
  );
};

ComingUp.displayName = 'ComingUp';

export { ComingUp };
