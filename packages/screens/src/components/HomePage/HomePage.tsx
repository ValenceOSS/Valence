import { useNavigate } from '@tanstack/react-router';
import { LibraryBrowser } from '@ValenceScreens/components/LibraryBrowser/LibraryBrowser';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useShell } from '@ValenceClient/shell/useShell';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { useHidden } from '@ValenceClient/library/useHidden';
import { ConfirmHiding } from '@ValenceScreens/components/ConfirmHiding/ConfirmHiding';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

/**
 * The front of the server: a hero drawn from every library, and the rows of everything to watch.
 */
const HomePage = () => {
  const { title, rememberItems, setStartOverride, setMoodLights, holdTheScreen } = useShell();
  const { place, go } = usePlace();
  const navigate = useNavigate();
  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const hiding = useHidden(watching);
  const { mayAdminister } = useWhatIMayDo();

  return (
    <>
      <ConfirmHiding hiding={hiding} />

      <LibraryBrowser
        name={title}
        search={place.search}
        {...(mayAdminister
          ? {
              onAddLibrary: () => {
                void navigate({ to: '/admin/$panel', params: { panel: 'libraries' } });
              },
            }
          : {})}
        onPlay={(media) => {
          go({ inspecting: media.id });
        }}
        onShow={(seriesId) => {
          go({ show: seriesId });
        }}
        onWatch={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ playing: media.id });
        }}
        onItemsLoaded={rememberItems}
        onReading={holdTheScreen}
        hasHero
        onPalette={setMoodLights}
        onOpenShow={(media) => {
          const series = showIdOf(media);

          if (series !== null) {
            go({ show: series });
          }
        }}
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

HomePage.displayName = 'HomePage';

export { HomePage };
