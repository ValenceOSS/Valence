import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { AskableResultsProps } from './AskableResults.types';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';

/**
 * What a search found that is not in the library yet, as a group of its own under what is: films
 * and series from the catalogue, and artists from MusicBrainz, for somebody who may ask for them —
 * each marked with what it is and whether it is asked for already. Choosing one opens its page,
 * where it can be asked for. Nothing is shown while requesting is off, or to somebody who may not
 * ask.
 *
 * @param query - What was searched for.
 * @param kind - Which kind of thing the search is narrowed to.
 * @param onAsk - Called with the title to open, as its address names it.
 */
const AskableResults = ({ query, kind, onAsk }: AskableResultsProps) => {
  const { may } = useWhatIMayDo();
  const requesting = useQuery(requestsQueries.availability());
  const isOn = requesting.data?.isEnabled === true;
  const mayVideo = isOn && may('requests.ask');
  const films = useQuery(
    requestsQueries.askableSearch(
      query,
      'film',
      mayVideo && (kind === 'everything' || kind === 'films'),
    ),
  );
  const series = useQuery(
    requestsQueries.askableSearch(
      query,
      'series',
      mayVideo && (kind === 'everything' || kind === 'shows'),
    ),
  );
  const artists = useQuery(
    requestsQueries.askableSearch(
      query,
      'artist',
      isOn && may('requests.askMusic') && kind === 'everything',
    ),
  );
  const notHere = (titles: CatalogueTitle[] | undefined) =>
    (titles ?? []).filter((title) => title.standing.status !== 'library');
  const video = [...notHere(films.data), ...notHere(series.data)];
  const music = notHere(artists.data);

  if (video.length === 0 && music.length === 0) {
    return null;
  }

  return (
    <section aria-label="Not in your library yet" className="flex flex-col gap-6">
      {video.length === 0 ? null : (
        <Rail title="Not in your library yet" sizesCards className="-mx-[var(--rail-lane)]">
          {video.map((title, at) => {
            return (
              <RevealItem
                key={`${title.kind}-${title.id}`}
                index={at}
                className="shrink-0 snap-start"
              >
                <MediaCard
                  title={title.title}
                  subtitle={title.year?.toString() ?? ''}
                  {...describeCatalogueCard(title)}
                  {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
                  onSelect={() => {
                    onAsk(askingOf(title));
                  }}
                />
              </RevealItem>
            );
          })}
        </Rail>
      )}

      {music.length === 0 ? null : (
        <Rail title="Artists not in your library yet" sizesCards className="-mx-[var(--rail-lane)]">
          {music.map((title, at) => (
            <RevealItem key={title.id} index={at} className="shrink-0 snap-start">
              <MusicTile
                title={title.title}
                detail={[title.subtitle, describeStanding(title.standing)?.label ?? null]
                  .filter((part) => part !== null)
                  .join(' · ')}
                shape="round"
                artwork={
                  <MusicArtwork
                    src={title.posterUrl}
                    label={title.title}
                    shape="round"
                    className="w-full"
                  />
                }
                onOpen={() => {
                  onAsk(askingOf(title));
                }}
              />
            </RevealItem>
          ))}
        </Rail>
      )}
    </section>
  );
};

AskableResults.displayName = 'AskableResults';

export { AskableResults };
