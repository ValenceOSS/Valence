import { useNavigate } from '@tanstack/react-router';
import { BrowseArea } from '@ValenceScreens/components/BrowseArea/BrowseArea';
import { showSlug } from '@ValenceCore/functions/showSlug';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useShell } from '@ValenceClient/shell/useShell';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { useHidden } from '@ValenceClient/library/useHidden';
import { ConfirmHiding } from '@ValenceScreens/components/ConfirmHiding/ConfirmHiding';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import type { BrowseKind } from '@ValenceScreens/components/BrowseArea/BrowseArea.types';

const BROWSABLE = ['shows', 'films', 'new', 'favourites'] as const;

/**
 * Says which of the browsable pages this is, falling back to films where the address named something
 * that is not one — which cannot happen through the router, and is a sensible page either way.
 *
 * @param section - What the address named.
 * @returns The page to draw.
 */
const kindOf = (section: string): BrowseKind =>
  BROWSABLE.find((candidate) => candidate === section) ?? 'films';

/**
 * A grid of everything of one sort: programmes, films, what arrived lately, or what is kept.
 */
const BrowsePage = () => {
  const { rememberItems, progress, setStartOverride } = useShell();
  const { place, go } = usePlace();
  const navigate = useNavigate();
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const keptBooks = useFavourites(watching, 'books');
  const hiding = useHidden(watching);
  const { mayAdminister } = useWhatIMayDo();

  return (
    <>
      <ConfirmHiding hiding={hiding} />

      <BrowseArea
        kind={kindOf(place.section)}
        libraryId={place.library}
        favourites={[...favourites.kept]}
        keptBooks={[...keptBooks.kept]}
        onOpenBook={(book) => {
          go({ book: book.id });
        }}
        onPlay={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ playing: media.id });
        }}
        onInspect={(media) => {
          go({ inspecting: media.id });
        }}
        {...(mayAdminister
          ? {
              onAddLibrary: () => {
                void navigate({ to: '/admin/$panel', params: { panel: 'libraries' } });
              },
            }
          : {})}
        onOpenShow={(media) => {
          const series = media.seriesId ?? showSlug(media.seriesTitle ?? '');

          if (series !== '') {
            go({ show: series });
          }
        }}
        onItemsLoaded={rememberItems}
        watchedFractionFor={(mediaId) => {
          const found = progress.get(mediaId);

          return found === undefined ? undefined : watchedFraction(found);
        }}
        resumeFor={(mediaId) => resumeFor(progress, mediaId)}
        isKept={favourites.isKept}
        onToggleKept={(media) => {
          favourites.toggle(media.id);
        }}
        onHide={(media) => {
          hiding.ask(media);
        }}
      />
    </>
  );
};

BrowsePage.displayName = 'BrowsePage';

export { BrowsePage };
