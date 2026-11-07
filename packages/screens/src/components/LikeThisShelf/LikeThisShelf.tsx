import { useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useHeldBadges } from '@ValenceScreens/library/useHeldBadges';
import { describeCatalogueCard } from '@ValenceScreens/components/AskableDialog/describeCatalogueCard';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { RevealItem } from '@ValenceUI/RevealItem';
import { useLikeThis } from '@ValenceClient/library/useLikeThis';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { DialogSection } from '@ValenceScreens/components/DialogSection/DialogSection';
import { say } from '@ValenceI18n/say';
import { useContext } from 'react';
import { AreSectionsOpen } from '@ValenceScreens/components/DialogSections/AreSectionsOpen';
import type { LikeThisShelfProps } from './LikeThisShelf.types';

/**
 * A row of the films and programmes most like a title, on that title's page: those in the libraries
 * first, a programme standing as one poster that opens it, then what the catalogue recommends for
 * whoever may ask for it, each saying whether it is here. Nothing is drawn where nothing is alike.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @param onPlay - Told to play one, from the start.
 * @param onInspect - Told to open a film's page.
 * @param onOpenShow - Told to open a programme's page.
 * @param kind - Whether the title is a film or a series, to ask the catalogue about it.
 * @param externalId - The catalogue's identifier for the title, where it has one.
 * @param onAsk - Told to open a title from the catalogue, as its address names it, and left out for
 *   whoever may not request.
 */
const LikeThisShelf = ({
  mediaId,
  onPlay,
  onInspect,
  onOpenShow,
  kind = 'film',
  externalId,
  onAsk,
}: LikeThisShelfProps) => {
  const isOpen = useContext(AreSectionsOpen);
  const alike = useLikeThis(mediaId);
  const heldBadgesOf = useHeldBadges();

  const asked = useQuery(
    requestsQueries.similarTitles(kind, externalId ?? null, onAsk !== undefined),
  );
  const heldIds = new Set(alike.flatMap((media) => media.externalId ?? []));
  const fromCatalogue = (asked.data?.titles ?? []).filter(
    (title) =>
      !heldIds.has(title.id) &&
      title.standing.status !== 'library' &&
      title.standing.status !== 'linked',
  );

  if (alike.length === 0 && fromCatalogue.length === 0) {
    return null;
  }

  return (
    <DialogSection>
      <Rail
        title={say('common.moreLikeThis')}
        sizesCards
        cards="portrait"
        hasArrows={false}
        look={isOpen ? 'title' : 'section'}
        className="px-0"
      >
        {alike.map((media, at) => (
          <RevealItem key={media.id} index={at} className="shrink-0 snap-start">
            <RailCard
              growsOnHover={false}
              media={media}
              shape="poster"
              isSeries={media.seriesId !== null}
              onPlay={onPlay}
              onInspect={onInspect}
              onOpenShow={onOpenShow}
              {...(onAsk === undefined ? {} : { badges: heldBadgesOf(media.libraryId) })}
            />
          </RevealItem>
        ))}

        {fromCatalogue.map((title, at) => (
          <RevealItem
            key={`${title.kind}:${title.id}`}
            index={alike.length + at}
            className="shrink-0 snap-start"
          >
            <MediaCard
              title={title.title}
              subtitle={title.year?.toString() ?? ''}
              badges={describeCatalogueCard(title).badges}
              {...(title.posterUrl === null ? {} : { imageUrl: title.posterUrl })}
              onSelect={() => {
                onAsk?.(askingOf(title));
              }}
            />
          </RevealItem>
        ))}
      </Rail>
    </DialogSection>
  );
};

LikeThisShelf.displayName = 'LikeThisShelf';

export { LikeThisShelf };
