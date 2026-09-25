import { motion } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { RAIL } from '@ValenceUI/tokens/rail';
import { staggerVariants } from '@ValenceUI/animations/reveal';
import { SearchArea } from '@ValenceScreens/components/SearchArea/SearchArea';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useShell } from '@ValenceClient/shell/useShell';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { useHidden } from '@ValenceClient/library/useHidden';
import { ConfirmHiding } from '@ValenceScreens/components/ConfirmHiding/ConfirmHiding';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { showSlug } from '@ValenceCore/functions/showSlug';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { say } from '@ValenceI18n/say';

/**
 * Searching the whole server, as a page of its own rather than a sheet over whatever was underneath.
 * A page, because what is typed belongs to the search and to nothing else: raised over the home page
 * it filtered the rails behind it, so the library appeared to empty as somebody typed.
 */
const SearchPage = () => {
  const { rememberItems, progress, setStartOverride } = useShell();
  const { place, go, replace } = usePlace();
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const hiding = useHidden(watching);

  return (
    <motion.main
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      exit="gone"
      className={cn(RAIL.lane, RAIL.inset, 'flex flex-col gap-6 pt-6 pb-16')}
    >
      <h1 className="sr-only">{say('screens.searchPage.heading')}</h1>

      <ConfirmHiding hiding={hiding} />

      <SearchArea
        search={place.search}
        onSearchChange={(next) => {
          replace({ search: next });
        }}
        genre={place.genre}
        onGenreChange={(next) => {
          replace({ genre: next });
        }}
        onPlay={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ playing: media.id });
        }}
        onInspect={(media) => {
          go({ inspecting: media.id });
        }}
        onAsk={(asking) => {
          go({ asking });
        }}
        onItemsLoaded={rememberItems}
        onOpenShow={(media) => {
          const series = media.seriesId ?? showSlug(media.seriesTitle ?? '');

          if (series !== '') {
            go({ show: series });
          }
        }}
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
        onOpenBook={(book) => {
          go({ book: book.id });
        }}
      />
    </motion.main>
  );
};

SearchPage.displayName = 'SearchPage';

export { SearchPage };
