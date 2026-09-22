import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TVFocusGuideView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { MoodBackdrop } from '@ValenceTv/components/MoodBackdrop/MoodBackdrop';
import { TopBar } from '@ValenceTv/components/TopBar/TopBar';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { Account } from '@ValenceTv/screens/Account/Account';
import { Catalogue } from '@ValenceTv/screens/Catalogue/Catalogue';
import { FilmPage } from '@ValenceTv/screens/FilmPage/FilmPage';
import { Home } from '@ValenceTv/screens/Home/Home';
import { Player } from '@ValenceTv/screens/Player/Player';
import { Search } from '@ValenceTv/screens/Search/Search';
import { ShowPage } from '@ValenceTv/screens/ShowPage/ShowPage';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { UpTarget } from '@ValenceTv/components/SystemSearch/SystemSearch.types';
import type { Place } from '@ValenceTv/navigation/Place';
import type { Tab } from '@ValenceTv/navigation/Tab';
import type { SignedInProps } from './SignedIn.types';

const WATCHABLE = new Set(['movies', 'shows']);

const UNDER_THE_BAR = 130;

/**
 * Everything behind the way in: the capsule floating along the top — search, Home, Films, Shows and
 * who is watching — the part it points at, and the pages opened from them, one on top of another.
 *
 * The whole screen is lit by what the front page is showing. Menu goes back a page at a time, and
 * from the parts themselves leaves the app as it does anywhere else on the television. A card for an
 * episode or a programme opens the programme; anything else opens its own page; playing takes over
 * the whole screen until it ends or Menu is pressed.
 *
 * Pressing up from anywhere on a part reaches the capsule, through a guide across the whole width
 * beneath it — the capsule sits in the middle, and the remote only moves to what is in line with
 * it — which steps aside while the remote is in the capsule, so pressing down leaves it.
 *
 * The parts stay mounted beneath whatever is open, hidden, so going back finds the front page
 * scrolled where it was, its preview stopped while it is covered.
 *
 * @param user - Who is signed in.
 * @param onChangeServer - Told when somebody wants a different Valence.
 */
const SignedIn = ({ user, onChangeServer }: SignedInProps) => {
  const [tab, setTab] = useState<Tab>('home');
  const [opened, setOpened] = useState<readonly Place[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [capsule, setCapsule] = useState<UpTarget>(null);
  const [isInBar, setIsInBar] = useState(false);
  const libraries = useQuery(libraryQueries.all());
  const watching = useQuery(profileQueries.watching());

  const watchable = useMemo(
    () => (libraries.data ?? []).filter((one) => WATCHABLE.has(one.kind)).map((one) => one.id),
    [libraries.data],
  );

  const open = useCallback((place: Place) => {
    setOpened((was) => [...was, place]);
  }, []);

  const back = useCallback(() => {
    setOpened((was) => was.slice(0, -1));
  }, []);

  useMenuButton(opened.length === 0 ? null : back);

  const openTitle = useCallback(
    (media: MediaSummary) => {
      const showId = showIdOf(media);

      open(
        showId === null
          ? { kind: 'film', mediaId: media.id }
          : { kind: 'show', libraryId: media.libraryId, showId },
      );
    },
    [open],
  );

  const play = useCallback(
    (media: MediaSummary, startSeconds: number) => {
      open({ kind: 'play', mediaId: media.id, startSeconds, carriedOn: 0 });
    },
    [open],
  );

  const feature = useCallback((media: MediaSummary) => {
    setMood(media.hasBackdrop ? artworkUrl(media.id, 'backdrop') : null);
  }, []);

  const top = opened.at(-1);

  return (
    <View style={styles.screen}>
      <View style={[styles.screen, top !== undefined && styles.hidden]}>
        <MoodBackdrop path={tab === 'home' ? null : mood} />

        <View style={styles.page}>
          {tab === 'home' ? (
            <Home
              viewerId={user.id}
              watchable={watchable}
              onOpen={openTitle}
              onPlay={play}
              isCovered={top !== undefined}
              onFeature={feature}
            />
          ) : (
            <View style={styles.underTheBar}>
              <FadeIn key={tab}>
                {tab === 'account' ? (
                  <Account user={user} onChangeServer={onChangeServer} />
                ) : tab === 'search' ? (
                  <Search watchable={watchable} onOpen={openTitle} upTo={capsule} />
                ) : (
                  <Catalogue kind={tab} watchable={watchable} onOpen={openTitle} />
                )}
              </FadeIn>
            </View>
          )}
        </View>

        <TVFocusGuideView
          style={styles.upward}
          destinations={isInBar || capsule === null ? [] : [capsule]}
        />

        <TopBar
          current={tab}
          onChoose={setTab}
          profile={watching.data ?? null}
          capsuleRef={setCapsule}
          onInBar={setIsInBar}
        />
      </View>

      {top?.kind === 'film' ? (
        <View style={styles.over}>
          <FilmPage key={top.mediaId} mediaId={top.mediaId} viewerId={user.id} onPlay={play} />
        </View>
      ) : null}

      {top?.kind === 'show' ? (
        <View style={styles.over}>
          <ShowPage key={top.showId} libraryId={top.libraryId} showId={top.showId} onPlay={play} />
        </View>
      ) : null}

      {top?.kind === 'play' ? (
        <View style={styles.over}>
          <Player
            key={`${top.mediaId}:${top.startSeconds.toString()}`}
            mediaId={top.mediaId}
            startSeconds={top.startSeconds}
            onLeave={back}
          />
        </View>
      ) : null}
    </View>
  );
};

SignedIn.displayName = 'SignedIn';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colours.canvas },
  page: { flex: 1 },
  underTheBar: { flex: 1, paddingTop: UNDER_THE_BAR },
  hidden: { display: 'none' },
  upward: { position: 'absolute', top: UNDER_THE_BAR - 12, left: 0, right: 0, height: 4 },
  over: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: tokens.colours.canvas,
  },
});

export { SignedIn };
