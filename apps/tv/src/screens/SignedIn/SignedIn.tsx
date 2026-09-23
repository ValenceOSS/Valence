import { useCallback, useEffect, useMemo, useState } from 'react';
import { findNodeHandle, Linking, StyleSheet, useTVEventHandler, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useFreshFromTheSocket } from '@ValenceClient/query/useFreshFromTheSocket';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { watchPresence } from '@ValenceClient/presence/watchPresence';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { useMusicRemote } from '@ValenceClient/music/useMusicRemote';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useSystemNowPlaying } from '@ValenceTv/music/useSystemNowPlaying';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { ArrivalBanner } from '@ValenceTv/components/ArrivalBanner/ArrivalBanner';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { FocusFence } from '@ValenceTv/components/FocusFence/FocusFence';
import { MoodBackdrop } from '@ValenceTv/components/MoodBackdrop/MoodBackdrop';
import { NowPlayingChip } from '@ValenceTv/components/NowPlayingChip/NowPlayingChip';
import { TopBar } from '@ValenceTv/components/TopBar/TopBar';
import { useHandOff } from '@ValenceTv/navigation/useHandOff';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { readOpeningLink } from '@ValenceTv/navigation/readOpeningLink';
import { readArrivalLink } from '@ValenceTv/notifications/readArrivalLink';
import { useArrivals } from '@ValenceTv/notifications/useArrivals';
import { Account } from '@ValenceTv/screens/Account/Account';
import { Catalogue } from '@ValenceTv/screens/Catalogue/Catalogue';
import { AskPage } from '@ValenceTv/screens/AskPage/AskPage';
import { FilmPage } from '@ValenceTv/screens/FilmPage/FilmPage';
import { Home } from '@ValenceTv/screens/Home/Home';
import { Music } from '@ValenceTv/screens/Music/Music';
import { MusicCollection } from '@ValenceTv/screens/MusicCollection/MusicCollection';
import { NowPlaying } from '@ValenceTv/screens/NowPlaying/NowPlaying';
import { Player } from '@ValenceTv/screens/Player/Player';
import { RequestsPage } from '@ValenceTv/screens/RequestsPage/RequestsPage';
import { Search } from '@ValenceTv/screens/Search/Search';
import { ShowPage } from '@ValenceTv/screens/ShowPage/ShowPage';
import { tokens } from '@ValenceTv/theme/tokens';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import type { Place } from '@ValenceTv/navigation/Place';
import type { Tab } from '@ValenceTv/navigation/Tab';
import type { MusicItem } from '@ValenceTv/music/MusicItem';
import type { HWEvent } from 'react-native';
import type { SignedInProps } from './SignedIn.types';

const WATCHABLE = new Set(['movies', 'shows']);

const UNDER_THE_BAR = 130;

const KEPT = ['films', 'shows', 'music', 'account'] as const;

type Moods = {
  home: string | null;
  films: string | null;
  shows: string | null;
  music: string | null;
  search: string | null;
};

/**
 * The picture a title lights the page with, where it has one.
 *
 * @param media - The title.
 * @returns Where its backdrop is served, or nothing.
 */
const moodOf = (media: MediaSummary): string | null =>
  media.hasBackdrop ? artworkUrl(media.id, 'backdrop') : null;

/**
 * Everything behind the way in: the capsule floating along the top — search, Home, Films, Shows and
 * who is watching — the part it points at, and the pages opened from them, one on top of another.
 *
 * Each page is lit by its own picture: the front page by the title its top is showing, Films and
 * Shows by the poster the remote has come to rest on, a title's page by that title, search by the
 * first poster on its shelves, the profile by the face of whoever is watching, and the list of
 * requests by the newest one asked for. The light crossfades as the page changes. Menu goes back a page at
 * a time, and from the parts themselves leaves the app as it does anywhere else on the television. A
 * card for an
 * episode or a programme opens the programme; anything else opens its own page; playing takes over
 * the whole screen until it ends or Menu is pressed.
 *
 * A title found in search or on the discovery shelves that the library lacks opens a page for
 * asking for it, lit by its own picture once its details arrive; one the library already has opens
 * its own page instead.
 *
 * Pressing up from the top of a part reaches the item in the capsule it belongs under, which each part
 * is handed and asks to take the remote. The capsule sits in the middle, and the television only moves
 * the remote to what is in line with it; guides laid across the page to catch it could themselves be
 * landed on, which is what left a stop on nothing between the bar and the page. Pressing down from
 * the Home tab hands the remote to the hero's Play button the same way, since it sits at the left,
 * far from the tab.
 *
 * The parts stay mounted beneath whatever is open, hidden, so going back finds the front page
 * scrolled where it was, its preview stopped while it is covered, fading back in as it is uncovered
 * just as a page fades in as it opens; the bar along the top stays put throughout, so a face flying
 * up into it as somebody signs in lands where the bar really is. The front page also stays mounted,
 * hidden, while another part is showing, since it is the heaviest thing to build — a hero and a
 * dozen shelves of pictures — and coming back to Home would otherwise build all of it again. Films,
 * Shows and the profile are the same once first opened, each fading back in as it is shown, so moving
 * along the bar only shows and hides what is already built. Search alone is built afresh each time,
 * since the television's own search screen owns its keyboard.
 *
 * A hidden part is see-through and fenced off from the remote, rather than taken out of the
 * layout, so showing it again changes one value instead of laying every view in it out afresh. Each
 * is kept as a view of its own: React Native otherwise folds a plain wrapper into its parent, and
 * making it see-through would unfold it, moving every view in the part out and back in again.
 *
 * A title chosen on the television's top shelf opens Valence at its page, and a film sent from
 * another of this person's devices — a phone, a laptop — plays straight away, over whatever was
 * open, the device that sent it becoming its remote.
 *
 * Music stops altogether as somebody signs out, changes who is watching or moves to another
 * Valence, rather than carrying on for whoever comes next.
 *
 * Music is offered only where the server has a music library with something in it.
 *
 * Whatever song is playing is kept in the top right corner over every page but the players, for
 * the remote to open it from wherever somebody has got to. Opened from one of the parts, it opens
 * over the music part, so going back from it lands there rather than where it was opened from.
 *
 * When something this viewer asked for arrives, a banner slides in to say so, and Play/Pause opens
 * it; nothing is announced over the player.
 *
 * It listens to the server's socket as the web does, so the library, notifications and requests are
 * read again the moment the server says they have changed, rather than when somebody next looks.
 *
 * @param user - Who is signed in.
 * @param onChangeServer - Told when somebody wants a different Valence.
 * @param isArriving - Whether the face of whoever signed in and Valence's mark are still flying up
 *   into the bar.
 * @param onFaceAt - Told where the face sits in the bar, for it to fly to.
 * @param onMarkAt - Told where Valence's mark sits in the bar, for it to fly to.
 */
const SignedIn = ({ user, onChangeServer, isArriving, onFaceAt, onMarkAt }: SignedInProps) => {
  useFreshFromTheSocket(getRealtimeClient());
  useEffect(() => watchPresence(), [user]);
  useMusicRemote();
  useSystemNowPlaying();

  const watchingId = useQuery(profileQueries.watching()).data?.id ?? null;

  useEffect(
    () => () => {
      theMusicPlayer().leave();
    },
    [user.id, watchingId],
  );

  const [tab, setTab] = useState<Tab>('home');
  const [visited, setVisited] = useState<ReadonlySet<Tab>>(new Set(['home']));
  const [opened, setOpened] = useState<readonly Place[]>([]);
  const [moods, setMoods] = useState<Moods>({
    home: null,
    films: null,
    shows: null,
    music: null,
    search: null,
  });
  const [items, setItems] = useState<ReadonlyMap<Tab, View>>(new Map());
  const [heroPlay, setHeroPlay] = useState<View | null>(null);
  const downFromBar = useHandOff('down', tab === 'home' ? heroPlay : null);

  const tabFocus = useCallback(
    (isIn: boolean) => {
      if (isIn) {
        downFromBar.arrive();
      } else {
        downFromBar.leave();
      }
    },
    [downFromBar],
  );

  const itemRef = useCallback((item: Tab, element: View | null) => {
    setItems((was) => {
      if ((was.get(item) ?? null) === element) {
        return was;
      }

      const next = new Map(was);

      if (element === null) {
        next.delete(item);
      } else {
        next.set(item, element);
      }

      return next;
    });
  }, []);

  const homeTab = items.get('home') ?? null;
  const searchPill = items.get('search') ?? null;
  const searchTag = useMemo(
    () => (searchPill === null ? null : findNodeHandle(searchPill)),
    [searchPill],
  );
  const libraries = useQuery(libraryQueries.all());
  const watching = useQuery(profileQueries.watching());

  const watchable = useMemo(
    () => (libraries.data ?? []).filter((one) => WATCHABLE.has(one.kind)).map((one) => one.id),
    [libraries.data],
  );

  const hasMusicLibrary = useMemo(
    () => (libraries.data ?? []).some((one) => one.kind === 'music'),
    [libraries.data],
  );
  const albums = useQuery({ ...musicQueries.albums('recent'), enabled: hasMusicLibrary });
  const hasMusic = hasMusicLibrary && (albums.data?.length ?? 0) > 0;

  const choose = useCallback((part: Tab) => {
    setTab(part);
    setVisited((was) => (was.has(part) ? was : new Set([...was, part])));
  }, []);

  useEffect(() => {
    if (!hasMusic && tab === 'music') {
      setTab('home');
    }
  }, [hasMusic, tab]);

  const open = useCallback((place: Place) => {
    setOpened((was) => [...was, place]);
  }, []);

  const back = useCallback(() => {
    setOpened((was) => was.slice(0, -1));
  }, []);

  useEffect(
    () =>
      onPresenceEvent((event) => {
        if (event.kind !== 'video' || event.command.kind !== 'play') {
          return;
        }

        const { mediaId, startSeconds } = event.command;

        setOpened((was) => [
          ...was.filter((place) => place.kind !== 'play' && place.kind !== 'nowPlaying'),
          { kind: 'play', mediaId, startSeconds: Math.floor(startSeconds), carriedOn: 0 },
        ]);
      }),
    [],
  );

  const playNext = useCallback((media: MediaSummary, carriedOn: number) => {
    setOpened((was) => [
      ...was.slice(0, -1),
      { kind: 'play', mediaId: media.id, startSeconds: 0, carriedOn },
    ]);
  }, []);

  useMenuButton(opened.length === 0 ? null : back);

  const openTitle = useCallback(
    (media: MediaSummary) => {
      const showId = showIdOf(media);
      const mood = moodOf(media);

      open(
        showId === null
          ? { kind: 'film', mediaId: media.id, mood }
          : { kind: 'show', libraryId: media.libraryId, showId, mood },
      );
    },
    [open],
  );

  const openFilm = useCallback(
    (mediaId: string) => {
      open({ kind: 'film', mediaId, mood: artworkUrl(mediaId, 'backdrop') });
    },
    [open],
  );

  const openRequests = useCallback(() => {
    open({ kind: 'requests', mood: null });
  }, [open]);

  const openRequest = useCallback(
    (request: MediaRequest) => {
      if ((request.kind === 'film' || request.kind === 'series') && request.tmdbId !== null) {
        open({ kind: 'ask', titleKind: request.kind, id: request.tmdbId.toString(), mood: null });
      }
    },
    [open],
  );

  const cache = useQueryClient();
  const { arrival, dismiss } = useArrivals();
  const arrived = arrival === null ? null : readArrivalLink(arrival.link);

  const openByMediaId = useCallback(
    (wanted: { kind: 'film' | 'show'; mediaId: string }) => {
      if (wanted.kind === 'film') {
        openFilm(wanted.mediaId);

        return;
      }

      void cache.fetchQuery(libraryQueries.detail(wanted.mediaId)).then((detail) => {
        if (detail !== null) {
          openTitle(summariseDetail(detail));
        }
      });
    },
    [cache, openFilm, openTitle],
  );

  const openAsk = useCallback(
    (title: CatalogueTitle) => {
      if (title.kind !== 'film' && title.kind !== 'series') {
        return;
      }

      const had = title.standing.status === 'library' ? title.standing.mediaId : null;

      if (had !== null) {
        openByMediaId({ kind: title.kind === 'film' ? 'film' : 'show', mediaId: had });

        return;
      }

      open({ kind: 'ask', titleKind: title.kind, id: title.id, mood: null });
    },
    [open, openByMediaId],
  );

  const watchArrival = useCallback(() => {
    if (arrived !== null) {
      openByMediaId(arrived);
    }
  }, [arrived, openByMediaId]);

  useEffect(() => {
    const follow = (link: string | null) => {
      const wanted = readOpeningLink(link);

      if (wanted !== null) {
        openByMediaId(wanted);
      }
    };

    void Linking.getInitialURL().then(follow);

    const listening = Linking.addEventListener('url', ({ url }) => {
      follow(url);
    });

    return () => {
      listening.remove();
    };
  }, [openByMediaId]);

  const lightTheTop = useCallback((mood: string | null) => {
    setOpened((was) => {
      const last = was.at(-1);

      return last === undefined || last.kind === 'play' || last.mood === mood
        ? was
        : [...was.slice(0, -1), { ...last, mood }];
    });
  }, []);

  const play = useCallback(
    (media: MediaSummary, startSeconds: number) => {
      open({ kind: 'play', mediaId: media.id, startSeconds, carriedOn: 0 });
    },
    [open],
  );

  const feature = useCallback((media: MediaSummary) => {
    setMoods((was) => ({ ...was, home: moodOf(media) }));
  }, []);

  const featureFilm = useCallback((media: MediaSummary) => {
    setMoods((was) => ({ ...was, films: moodOf(media) }));
  }, []);

  const featureSearch = useCallback((path: string | null) => {
    setMoods((was) => ({ ...was, search: path }));
  }, []);

  const featureMusic = useCallback((path: string | null) => {
    setMoods((was) => ({ ...was, music: path }));
  }, []);

  const openMusic = useCallback(
    (item: MusicItem) => {
      open({ kind: 'music', view: item.view, mood: item.art });
    },
    [open],
  );

  const openNowPlaying = useCallback(() => {
    setOpened((was) =>
      was.at(-1)?.kind === 'nowPlaying' ? was : [...was, { kind: 'nowPlaying', mood: null }],
    );
  }, []);

  const closeNowPlaying = useCallback(() => {
    setOpened((was) => was.filter((place) => place.kind !== 'nowPlaying'));
  }, []);

  const featureShow = useCallback((media: MediaSummary) => {
    setMoods((was) => ({ ...was, shows: moodOf(media) }));
  }, []);

  const top = opened.at(-1);
  const isWatching = top?.kind === 'play';

  useEffect(() => {
    if (isWatching) {
      theMusicPlayer().pause();
    }
  }, [isWatching]);

  const hearPlayPause = useCallback(
    (event: HWEvent) => {
      if (event.eventType !== 'playPause' || isWatching || arrival !== null) {
        return;
      }

      const music = theMusicPlayer();

      if (music.read().current !== null || music.read().remote !== null) {
        music.toggle();
      }
    },
    [isWatching, arrival],
  );

  useTVEventHandler(hearPlayPause);
  const faceMood =
    watching.data === undefined || watching.data === null ? null : profileAvatarUrl(watching.data);
  const pageOnTop = opened.findLast((place) => place.kind !== 'play');
  const mood = pageOnTop !== undefined ? pageOnTop.mood : tab === 'account' ? faceMood : moods[tab];

  return (
    <View style={styles.screen}>
      <MoodBackdrop path={mood} />

      <FocusFence
        isShut={top !== undefined}
        style={[styles.parts, top !== undefined && styles.away]}
      >
        <FadeIn isShown={top === undefined}>
          <View style={styles.page}>
            <FocusFence
              isShut={tab !== 'home'}
              style={[styles.layer, tab !== 'home' && styles.away]}
            >
              <FadeIn isShown={tab === 'home' && !isArriving}>
                <Home
                  isHeldBack={isArriving}
                  viewerId={user.id}
                  watchable={watchable}
                  onOpen={openTitle}
                  onPlay={play}
                  isCovered={top !== undefined || tab !== 'home'}
                  onFeature={feature}
                  upTo={homeTab}
                  playRef={setHeroPlay}
                />
              </FadeIn>
            </FocusFence>

            {KEPT.map((part) =>
              visited.has(part) ? (
                <FocusFence
                  key={part}
                  isShut={tab !== part}
                  style={[styles.layer, styles.underTheBar, tab !== part && styles.away]}
                >
                  <FadeIn isShown={tab === part}>
                    {part === 'music' ? (
                      <Music
                        onOpen={openMusic}
                        onFeature={featureMusic}
                        upTo={items.get('music') ?? null}
                      />
                    ) : part === 'account' ? (
                      <Account
                        user={user}
                        onChangeServer={onChangeServer}
                        onRequests={openRequests}
                        onOpenRequest={openRequest}
                        upTo={items.get('account') ?? null}
                      />
                    ) : (
                      <Catalogue
                        kind={part}
                        watchable={watchable}
                        onOpen={openTitle}
                        onFeature={part === 'films' ? featureFilm : featureShow}
                        upTo={items.get(part) ?? null}
                      />
                    )}
                  </FadeIn>
                </FocusFence>
              ) : null,
            )}

            {tab === 'search' ? (
              <View style={styles.underTheBar}>
                <FadeIn>
                  <Search
                    watchable={watchable}
                    onOpen={openTitle}
                    onAsk={openAsk}
                    onFeature={featureSearch}
                    upTo={searchTag}
                    hasMusic={hasMusic}
                    onOpenMusic={openMusic}
                    onPlayedMusic={openNowPlaying}
                  />
                </FadeIn>
              </View>
            ) : null}
          </View>
        </FadeIn>

        <TopBar
          current={tab}
          onChoose={choose}
          profile={watching.data ?? null}
          itemRef={itemRef}
          onTabFocus={tabFocus}
          isArriving={isArriving}
          onFaceAt={onFaceAt}
          onMarkAt={onMarkAt}
          hasMusic={hasMusic}
        />
      </FocusFence>

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

      {top?.kind === 'ask' ? (
        <View style={styles.over}>
          <AskPage
            key={`${top.titleKind}:${top.id}`}
            kind={top.titleKind}
            id={top.id}
            onOpenFilm={openFilm}
            onLight={lightTheTop}
          />
        </View>
      ) : null}

      {top?.kind === 'music' ? (
        <View style={styles.over}>
          <MusicCollection
            key={`${top.view.kind}:${top.view.kind === 'liked' ? '' : top.view.id}`}
            view={top.view}
            onPlayed={openNowPlaying}
            onOpen={openMusic}
            onLight={lightTheTop}
          />
        </View>
      ) : null}

      {top?.kind === 'nowPlaying' ? (
        <View style={styles.over}>
          <NowPlaying onEmpty={closeNowPlaying} onBack={back} />
        </View>
      ) : null}

      {top?.kind === 'requests' ? (
        <View style={styles.over}>
          <RequestsPage onOpen={openRequest} onLight={lightTheTop} />
        </View>
      ) : null}

      {top?.kind === 'play' ? (
        <View style={[styles.over, styles.dark]}>
          <Player
            key={`${top.mediaId}:${top.startSeconds.toString()}`}
            mediaId={top.mediaId}
            startSeconds={top.startSeconds}
            carriedOn={top.carriedOn}
            onLeave={back}
            onNext={playNext}
          />
        </View>
      ) : null}

      {isWatching || top?.kind === 'nowPlaying' ? null : (
        <View style={styles.playing}>
          <NowPlayingChip
            onOpen={() => {
              if (top === undefined && hasMusic) {
                choose('music');
              }

              openNowPlaying();
            }}
          />
        </View>
      )}

      {arrival === null || top?.kind === 'play' ? null : (
        <ArrivalBanner
          key={arrival.id}
          arrival={arrival}
          picture={arrived === null ? null : artworkUrl(arrived.mediaId, 'backdrop')}
          onWatch={watchArrival}
          onDismiss={dismiss}
        />
      )}
    </View>
  );
};

SignedIn.displayName = 'SignedIn';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colours.canvas },
  parts: { flex: 1 },
  page: { flex: 1 },
  underTheBar: { flex: 1, paddingTop: UNDER_THE_BAR },
  layer: { ...StyleSheet.absoluteFill },
  away: { opacity: 0 },
  over: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  dark: { backgroundColor: tokens.colours.canvas },
  playing: { position: 'absolute', top: tokens.space.md, right: tokens.space.edge },
});

export { SignedIn };
