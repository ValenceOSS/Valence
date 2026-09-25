import { CircleUser, Download, Home, Search } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import {
  STILL_WATCHING_ANSWER_SECONDS,
  STILL_WATCHING_OFF,
} from '@ValenceContracts/schemas/StillWatching';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { signOut } from '@ValenceClient/session/auth';
import { watchPresence } from '@ValenceClient/presence/watchPresence';
import { allowRealtimeClientToStart } from '@ValenceClient/realtime/getRealtimeClient';
import { useFreshFromTheSocket } from '@ValenceClient/query/useFreshFromTheSocket';
import { AnAskable } from '@ValenceMobile/components/AnAskable/AnAskable';
import { APerson } from '@ValenceMobile/components/APerson/APerson';
import { AShow } from '@ValenceMobile/components/AShow/AShow';
import { ATitle } from '@ValenceMobile/components/ATitle/ATitle';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { StillWatching } from '@ValenceMobile/components/StillWatching/StillWatching';
import { AnAlbum } from '@ValenceMobile/components/AnAlbum/AnAlbum';
import { AnArtist } from '@ValenceMobile/components/AnArtist/AnArtist';
import { APlaylist } from '@ValenceMobile/components/APlaylist/APlaylist';
import { TheLikedSongs } from '@ValenceMobile/components/TheLikedSongs/TheLikedSongs';
import { TheMusicRemote } from '@ValenceMobile/components/TheMusicRemote/TheMusicRemote';
import { TheMusicPlayer } from '@ValenceMobile/components/TheMusicPlayer/TheMusicPlayer';
import { ABook } from '@ValenceMobile/components/ABook/ABook';
import { AReader } from '@ValenceMobile/components/AReader/AReader';
import { TheNowPlayingBar } from '@ValenceMobile/components/TheNowPlayingBar/TheNowPlayingBar';
import { ACatalogueList } from '@ValenceMobile/components/ACatalogueList/ACatalogueList';
import { forgetTheMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { forgetTheAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { startListening } from '@ValenceClient/books/startListening';
import { useListeningKeptFresh } from '@ValenceClient/books/useListeningKeptFresh';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { TheListeningPlayer } from '@ValenceMobile/components/TheListeningPlayer/TheListeningPlayer';
import { theCodeInAScan } from '@ValenceClient/session/theCodeInAScan';
import { scanACode } from '@ValenceMobile/platform/scanACode';
import { ATabPage } from '@ValenceMobile/components/SignedIn/components/ATabPage/ATabPage';
import { TheAccount } from '@ValenceMobile/components/TheAccount/TheAccount';
import { TheDownloads } from '@ValenceMobile/components/TheDownloads/TheDownloads';
import { TheLibrary } from '@ValenceMobile/components/TheLibrary/TheLibrary';
import { TheNotifications } from '@ValenceMobile/components/TheNotifications/TheNotifications';
import { TheSearch } from '@ValenceMobile/components/TheSearch/TheSearch';
import { TheTabs } from '@ValenceMobile/components/TheTabs/TheTabs';
import { AProgrammeBySeries } from '@ValenceMobile/components/SignedIn/components/AProgrammeBySeries/AProgrammeBySeries';
import { UnderThePlayer } from '@ValenceMobile/components/SignedIn/components/UnderThePlayer/UnderThePlayer';
import { APageStack } from '@ValenceMobile/components/APageStack/APageStack';
import { useTheProgrammeOfEpisode } from '@ValenceMobile/hooks/useTheProgrammeOfEpisode';
import { Watching } from '@ValenceMobile/components/Watching/Watching';
import { WatchingHeld } from '@ValenceMobile/components/WatchingHeld/WatchingHeld';
import { useTellTheServerWhatIsHeld } from '@ValenceClient/downloads/useTellTheServerWhatIsHeld';
import { useFetchWhatThisDeviceAsked } from '@ValenceClient/downloads/useFetchWhatThisDeviceAsked';
import { sendWatchedOffline } from '@ValenceClient/offline/watchedOffline';
import { TheAlbums } from '@ValenceMobile/components/TheAlbums/TheAlbums';
import { TheArtists } from '@ValenceMobile/components/TheArtists/TheArtists';
import { AMusicPage } from '@ValenceMobile/components/AMusicPage/AMusicPage';
import { TheFloatingPlayer } from '@ValenceMobile/components/TheFloatingPlayer/TheFloatingPlayer';
import { ATelevisionToSignIn } from '@ValenceMobile/components/ATelevisionToSignIn/ATelevisionToSignIn';
import { useLinksIntoTheApp } from '@ValenceMobile/hooks/useLinksIntoTheApp';
import { say } from '@ValenceI18n/say';
import type { ReactNode } from 'react';
import type { Heard } from '@ValenceClient/books/heardLast';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { APage, SignedInProps } from './SignedIn.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const A_SERVER = /^[a-z][a-z0-9+.-]*:\/\/[^/?#\s]+/iu;

const MUSIC_PAGES: ReadonlySet<APage['kind']> = new Set([
  'album',
  'artist',
  'playlist',
  'liked',
  'albums',
  'artists',
]);

const styles = StyleSheet.create({
  over: { ...StyleSheet.absoluteFill },
  whole: { flex: 1 },
});

/**
 * What a phone shows once somebody is through: the library, a title or a programme out of it, or
 * something playing.
 *
 * Where they are is held here as a stack of pages rather than in an address, because a phone has no
 * address bar: a title, a programme, a person or something to ask for is laid over whatever opened
 * it, and going back takes the top one off.
 *
 * The library, search, requests and the account are tabs along the bottom, and the tab for requests is only there for
 * somebody this server lets ask. Anything opened from either covers the tabs until they go back.
 * Something asked for that has arrived opens in the library from its page, and a programme is
 * found by the series it became, since that is all a request knows of it.
 *
 * The player is laid over everything else rather than drawn instead of it, so what was open
 * underneath — the library, its answers and how far down it somebody had scrolled — is still there
 * when they come out, however long the film was. Nothing beneath it can be touched, read aloud or
 * left playing while it is up.
 *
 * Coming out of the player throws away what was known about how far through everything is, because
 * the thing they just watched is the one entry that is now wrong.
 *
 * When an episode plays to its end the next one in its season follows on its own, as it does on
 * the browser client, until as many have followed as this profile allows — then it asks first, and
 * asks instead of playing rather than over the top of something already started. Choosing an
 * episode by hand starts that count again.
 *
 * It joins presence as soon as somebody is through, which is what puts this phone in the list of
 * open sessions an operator watches and what carries an instruction to stop or pause back to it.
 * Presence is the socket rather than something kept beside one, so a phone that never opened one
 * was a phone the server could see asking for films and never see watching them. The same socket
 * says when anything this phone has asked for has changed, and it is closed once they sign out.
 *
 * Waits for the session before drawing any of it, because every request they make depends on being
 * signed in and a library drawn first would ask a question it cannot have the answer to.
 *
 * @param onElsewhere - Told that somebody wants to point this phone at a different server.
 * @param onOut - Told once they have signed out.
 * @param onFaceAt - Told where the account tab shows their face, for it to fly to on the way in.
 * @param isFaceArriving - Whether their face is still flying in, so the tab leaves its place empty.
 */
const SignedIn = ({ onOut, onElsewhere, onFaceAt, isFaceArriving = false }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());

  useEffect(() => {
    allowRealtimeClientToStart(true);

    const stopWatching = watchPresence();

    return () => {
      stopWatching();
      allowRealtimeClientToStart(false);
    };
  }, []);
  useFreshFromTheSocket();
  useEffect(() => {
    void sendWatchedOffline();
  }, []);
  useTellTheServerWhatIsHeld();
  useFetchWhatThisDeviceAsked();
  useListeningKeptFresh();
  const cache = useQueryClient();
  const [pages, setPages] = useState<readonly APage[]>([]);
  const [watching, setWatching] = useState<{ mediaId: string; startSeconds: number } | null>(null);
  const [carriedOn, setCarriedOn] = useState(0);
  const [watchingHeld, setWatchingHeld] = useState<HeldFile | null>(null);
  const [askingAbout, setAskingAbout] = useState<MediaSummary | null>(null);
  const [part, setPart] = useState('home');
  const kept = part === 'search' ? 'home' : part;
  const [libraryLeftOn, setLibraryLeftOn] = useState(part);

  useEffect(() => {
    if (part === 'home' || part === 'search') {
      setLibraryLeftOn(part);
    }
  }, [part]);
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([kept]));

  useEffect(() => {
    setVisited((was) => (was.has(kept) ? was : new Set([...was, kept])));
  }, [kept]);
  const holding = useTheProgrammeOfEpisode(watching?.mediaId ?? null);
  const series = useQuery(libraryQueries.show(holding?.libraryId ?? null, holding?.id ?? null));
  const watcher = useQuery(profileQueries.watching());
  const watched = useQuery(viewingQueries.progress());
  const episodes = series.data?.seasons.flatMap((season) => season.episodes) ?? [];
  const requesting = useQuery(requestsQueries.availability());
  const { may } = useWhatIMayDo();
  const mayRequest =
    requesting.data?.isEnabled === true && (may('requests.ask') || may('requests.askMusic'));
  const tabs = [
    { id: 'home', label: say('phone.signedIn.homeTab'), icon: Home, symbol: 'house' },
    {
      id: 'search',
      label: say('phone.signedIn.searchTab'),
      icon: Search,
      symbol: 'magnifyingglass',
    },
    {
      id: 'downloads',
      label: say('phone.signedIn.downloadsTab'),
      icon: Download,
      symbol: 'arrow.down.circle',
    },
    {
      id: 'account',
      label: say('phone.signedIn.accountTab'),
      icon: CircleUser,
      symbol: 'person.crop.circle',
      ...(watcher.data === null || watcher.data === undefined
        ? {}
        : {
            face: {
              picture: thePictureFor(watcher.data),
              backdrop: watcher.data.colour,
              initial: profileInitial(watcher.data.name),
            },
          }),
    },
  ];

  const open = (page: APage) => {
    setPages((was) => [...was, page]);
  };

  const swap = (page: APage) => {
    setPages((was) => [...was.slice(0, -1), page]);
  };

  const toAlbum = (albumId: string) => {
    open({ kind: 'album', albumId });
  };

  const toArtist = (artistId: string) => {
    open({ kind: 'artist', artistId });
  };

  const toPlaylist = (playlistId: string) => {
    open({ kind: 'playlist', playlistId });
  };

  useLinksIntoTheApp((link) => {
    if (link.kind === 'device') {
      open({ kind: 'television', code: link.code, askedFrom: link.server });
    }
  });

  useEffect(
    () => () => {
      forgetTheAudiobookPlayer();
      forgetTheMusicPlayer();
    },
    [],
  );

  const back = () => {
    setPages((was) => was.slice(0, -1));
  };

  const toTheListeningPlayer = () => {
    setPages((was) => (was.at(-1)?.kind === 'listening' ? was : [...was, { kind: 'listening' }]));
  };

  const openWhatIsHeard = (heard: Heard) => {
    if (heard === 'book') {
      toTheListeningPlayer();
    } else {
      open({ kind: 'playing' });
    }
  };

  const carryOnListening = (bookId: string) => {
    void cache.fetchQuery(bookQueries.one(bookId)).then(async (detail) => {
      if (detail !== null) {
        await startListening(detail, thePhonesAudiobookPlayer());
        toTheListeningPlayer();
      }
    });
  };

  const scanATelevision = async () => {
    const scanned = await scanACode();

    if (scanned.kind === 'closed') {
      return;
    }

    const said = scanned.kind === 'read' ? scanned.text.trim() : '';

    open({
      kind: 'television',
      code: theCodeInAScan(said) ?? '',
      askedFrom: A_SERVER.exec(said)?.[0] ?? null,
    });
  };

  const lookAt = (mediaId: string) => {
    open({ kind: 'title', mediaId });
  };

  const lookAtShow = (libraryId: string, showId: string) => {
    open({ kind: 'show', libraryId, showId });
  };

  const choose = (mediaId: string, startSeconds: number) => {
    setCarriedOn(0);
    setWatching({ mediaId, startSeconds });
  };

  const stopWatchingIt = () => {
    setWatching(null);
    void cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey });
  };

  const whenItEnds = () => {
    const playing = episodes.find((episode) => episode.id === watching?.mediaId) ?? null;
    const decided = decideWhatFollows({
      following: playing === null ? null : nextEpisode(episodes, playing),
      carriedOn,
      askAfter: watcher.data?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
    });

    if (decided.kind === 'nothing') {
      stopWatchingIt();

      return;
    }

    if (decided.kind === 'ask') {
      stopWatchingIt();
      setAskingAbout(decided.episode);

      return;
    }

    setCarriedOn((was) => was + 1);
    setWatching({ mediaId: decided.episode.id, startSeconds: 0 });
  };

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  /**
   * Draws one page of the stack.
   *
   * @param page - Which page.
   * @returns It.
   */
  const drawPage = (page: APage): ReactNode => {
    switch (page.kind) {
      case 'title':
        return (
          <ATitle
            mediaId={page.mediaId}
            onWatch={choose}
            onLookAtPerson={(personId) => {
              open({ kind: 'person', personId });
            }}
            onLookAtShow={lookAtShow}
            onBack={back}
          />
        );
      case 'show':
        return (
          <AShow
            libraryId={page.libraryId}
            showId={page.showId}
            onWatch={choose}
            onLookAt={lookAt}
            onBack={back}
          />
        );
      case 'series':
        return (
          <AProgrammeBySeries
            seriesId={page.seriesId}
            onWatch={choose}
            onLookAt={lookAt}
            onBack={back}
          />
        );
      case 'person':
        return (
          <APerson
            personId={page.personId}
            onLookAt={lookAt}
            onLookAtShow={lookAtShow}
            onBack={back}
          />
        );
      case 'asking':
        return (
          <AnAskable
            kind={page.about}
            id={page.id}
            onOpen={(kind, mediaId) => {
              swap(
                kind === 'film'
                  ? { kind: 'title', mediaId }
                  : { kind: 'series', seriesId: mediaId },
              );
            }}
            onBack={back}
          />
        );
      case 'browsing':
        return (
          <ACatalogueList
            browsing={page.browsing}
            title={page.title}
            onAsk={(about, id) => {
              open({ kind: 'asking', about, id });
            }}
            onBack={back}
          />
        );
      case 'notifications':
        return <TheNotifications onOpen={open} onBack={back} />;
      case 'album':
        return (
          <AnAlbum
            albumId={page.albumId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onPlaylist={toPlaylist}
            onBack={back}
          />
        );
      case 'artist':
        return (
          <AnArtist
            artistId={page.artistId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onPlaylist={toPlaylist}
            onBack={back}
          />
        );
      case 'playlist':
        return (
          <APlaylist
            playlistId={page.playlistId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onBack={back}
          />
        );
      case 'book':
        return (
          <ABook
            bookId={page.bookId}
            onRead={(bookId, chapterId, isFromTheStart) => {
              open({ kind: 'reading', bookId, chapterId, isFromTheStart });
            }}
            onListen={toTheListeningPlayer}
            onBack={back}
          />
        );
      case 'reading':
        return (
          <AReader
            bookId={page.bookId}
            chapterId={page.chapterId}
            isFromTheStart={page.isFromTheStart}
            onBack={back}
          />
        );
      case 'television':
        return <ATelevisionToSignIn code={page.code} askedFrom={page.askedFrom} onBack={back} />;
      case 'albums':
        return <TheAlbums onAlbum={toAlbum} onBack={back} />;
      case 'artists':
        return <TheArtists onArtist={toArtist} onBack={back} />;
      case 'liked':
        return (
          <TheLikedSongs
            onAlbum={toAlbum}
            onArtist={toArtist}
            onPlaylist={toPlaylist}
            onBack={back}
          />
        );
      case 'playing':
        return <TheMusicPlayer onArtist={toArtist} onAlbum={toAlbum} onBack={back} />;
      case 'listening':
        return <TheListeningPlayer onBack={back} />;
    }
  };

  const showing = (
    <>
      {visited.has('home') ? (
        <ATabPage isShowing={kept === 'home'}>
          <TheLibrary
            isSearching={part === 'search' || (part !== 'home' && libraryLeftOn === 'search')}
            searchPage={(header, searchingFor, onScrolled) => (
              <TheSearch
                header={header}
                searchingFor={searchingFor}
                onScrolled={onScrolled}
                onSeeAll={(browsing, title) => {
                  open({ kind: 'browsing', browsing, title });
                }}
                onLookAt={lookAt}
                onLookAtShow={lookAtShow}
                onAlbum={toAlbum}
                onArtist={toArtist}
                onPlaylist={(playlistId) => {
                  open({ kind: 'playlist', playlistId });
                }}
                onBook={(bookId) => {
                  open({ kind: 'book', bookId });
                }}
                onAsk={
                  mayRequest
                    ? (about, id) => {
                        open({ kind: 'asking', about, id });
                      }
                    : null
                }
              />
            )}
            onWatch={choose}
            onLookAt={lookAt}
            onLookAtShow={lookAtShow}
            onNotifications={() => {
              open({ kind: 'notifications' });
            }}
            onScan={() => {
              void scanATelevision();
            }}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onPlaylist={(playlistId) => {
              open({ kind: 'playlist', playlistId });
            }}
            onLiked={() => {
              open({ kind: 'liked' });
            }}
            onAllAlbums={() => {
              open({ kind: 'albums' });
            }}
            onAllArtists={() => {
              open({ kind: 'artists' });
            }}
            onBook={(bookId) => {
              open({ kind: 'book', bookId });
            }}
            onRead={(bookId) => {
              open({ kind: 'reading', bookId, chapterId: null, isFromTheStart: false });
            }}
            onListen={carryOnListening}
          />
        </ATabPage>
      ) : null}

      {visited.has('downloads') ? (
        <ATabPage isShowing={kept === 'downloads'}>
          <TheDownloads onWatch={setWatchingHeld} />
        </ATabPage>
      ) : null}

      {visited.has('account') ? (
        <ATabPage isShowing={kept === 'account'}>
          <TheAccount
            onOut={() => {
              void signOut().then(onOut);
            }}
            onElsewhere={onElsewhere}
          />
        </ATabPage>
      ) : null}
    </>
  );

  const covering =
    askingAbout !== null ? (
      <StillWatching
        upNext={askingAbout.title}
        secondsToAnswer={STILL_WATCHING_ANSWER_SECONDS}
        onCarryOn={() => {
          const next = askingAbout;

          setAskingAbout(null);
          choose(next.id, 0);
        }}
        onStop={() => {
          setAskingAbout(null);
        }}
      />
    ) : watchingHeld !== null ? (
      <WatchingHeld
        file={watchingHeld}
        onDone={() => {
          setWatchingHeld(null);
        }}
      />
    ) : watching !== null ? (
      <Watching
        key={watching.mediaId}
        mediaId={watching.mediaId}
        startSeconds={watching.startSeconds}
        onDone={stopWatchingIt}
        onEnded={whenItEnds}
        seasons={series.data?.seasons ?? []}
        onChooseEpisode={(chosen) => {
          choose(chosen, resumeFor(byMediaId(watched.data ?? []), chosen) ?? 0);
        }}
      />
    ) : null;
  const isCovered = covering !== null;

  const tabbed = (
    <TheTabs
      tabs={tabs}
      value={part}
      onSelect={setPart}
      {...(onFaceAt === undefined ? {} : { onFaceAt })}
      isFaceArriving={isFaceArriving}
      above={<TheNowPlayingBar onOpen={openWhatIsHeard} />}
    >
      {showing}
    </TheTabs>
  );

  return (
    <View style={styles.whole}>
      <View
        style={styles.whole}
        collapsable={false}
        pointerEvents={isCovered ? 'none' : 'auto'}
        accessibilityElementsHidden={isCovered}
        importantForAccessibility={isCovered ? 'no-hide-descendants' : 'auto'}
      >
        <APageStack
          pages={[
            {
              key: 'tabs',
              page: <UnderThePlayer isCovered={isCovered}>{tabbed}</UnderThePlayer>,
            },
            ...pages.map((page, index) => ({
              key: `${index.toString()}:${JSON.stringify(page)}`,
              page: (
                <UnderThePlayer isCovered={isCovered}>
                  {MUSIC_PAGES.has(page.kind) ? (
                    <AMusicPage>{drawPage(page)}</AMusicPage>
                  ) : (
                    drawPage(page)
                  )}
                </UnderThePlayer>
              ),
              rises: page.kind === 'playing' || page.kind === 'listening',
              holdsTheEdge: page.kind === 'reading',
            })),
          ]}
          onBack={back}
        />
        <TheMusicRemote />
        <TheFloatingPlayer
          isShown={MUSIC_PAGES.has(pages.at(-1)?.kind ?? 'playing')}
          onOpen={openWhatIsHeard}
        />
      </View>
      {covering === null ? null : (
        <View style={styles.over} collapsable={false}>
          {covering}
        </View>
      )}
    </View>
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };
