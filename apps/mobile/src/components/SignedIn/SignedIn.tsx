import { householdQueries } from '@ValenceClient/query/householdQueries';
import { ASetUpTheHousehold } from '@ValenceMobile/components/ASetUpTheHousehold/ASetUpTheHousehold';
import { AVideoRemote } from '@ValenceMobile/components/AVideoRemote/AVideoRemote';
import { AVideoRemoteBar } from '@ValenceMobile/components/AVideoRemoteBar/AVideoRemoteBar';
import { CircleUser, Download, Home, Search } from '@keyline-icons/react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
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
import { signOut } from '@ValenceClient/session/auth';
import { forgetThePictures } from '@ValenceMobile/platform/forgetThePictures';
import { watchPresence } from '@ValenceClient/presence/watchPresence';
import {
  allowRealtimeClientToStart,
  getRealtimeClient,
} from '@ValenceClient/realtime/getRealtimeClient';
import { useWatchParty } from '@ValenceClient/party/useWatchParty';
import { useListenAlong } from '@ValenceClient/party/useListenAlong';
import { PARTY_NOTICE_LINGERS_MS } from '@ValenceClient/party/PARTY_NOTICE_LINGERS_MS';
import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import { useFreshFromTheSocket } from '@ValenceClient/query/useFreshFromTheSocket';
import { AnAskable } from '@ValenceMobile/components/AnAskable/AnAskable';
import { APerson } from '@ValenceMobile/components/APerson/APerson';
import { ACollection } from '@ValenceMobile/components/ACollection/ACollection';
import { AShow } from '@ValenceMobile/components/AShow/AShow';
import { ATitle } from '@ValenceMobile/components/ATitle/ATitle';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { StillWatching } from '@ValenceMobile/components/StillWatching/StillWatching';
import { AnAlbum } from '@ValenceMobile/components/AnAlbum/AnAlbum';
import { AnArtist } from '@ValenceMobile/components/AnArtist/AnArtist';
import { APlaylist } from '@ValenceMobile/components/APlaylist/APlaylist';
import { AMix } from '@ValenceMobile/components/AMix/AMix';
import { TheLikedSongs } from '@ValenceMobile/components/TheLikedSongs/TheLikedSongs';
import { TheMusicRemote } from '@ValenceMobile/components/TheMusicRemote/TheMusicRemote';
import { TheAudiobookRemote } from '@ValenceMobile/components/TheAudiobookRemote/TheAudiobookRemote';
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
import { TheAccountPage } from '@ValenceMobile/components/TheAccountPage/TheAccountPage';
import { TheDownloads } from '@ValenceMobile/components/TheDownloads/TheDownloads';
import { TheLibrary } from '@ValenceMobile/components/TheLibrary/TheLibrary';
import { TheNotifications } from '@ValenceMobile/components/TheNotifications/TheNotifications';
import { TheCalendar } from '@ValenceMobile/components/TheCalendar/TheCalendar';
import { TheSearch } from '@ValenceMobile/components/TheSearch/TheSearch';
import { TheTabs } from '@ValenceMobile/components/TheTabs/TheTabs';
import { AProgrammeBySeries } from '@ValenceMobile/components/SignedIn/components/AProgrammeBySeries/AProgrammeBySeries';
import { UnderThePlayer } from '@ValenceMobile/components/SignedIn/components/UnderThePlayer/UnderThePlayer';
import { APageStack } from '@ValenceMobile/components/APageStack/APageStack';
import { pageInTheLibrary } from '@ValenceMobile/components/SignedIn/pageInTheLibrary';
import { pageToAskAbout } from '@ValenceMobile/components/SignedIn/pageToAskAbout';
import { useTheProgrammeOfEpisode } from '@ValenceClient/library/useTheProgrammeOfEpisode';
import { Watching } from '@ValenceMobile/components/Watching/Watching';
import { WatchingTogether } from '@ValenceMobile/components/SignedIn/components/WatchingTogether/WatchingTogether';
import { useTellTheServerWhatIsHeld } from '@ValenceClient/downloads/useTellTheServerWhatIsHeld';
import { useFetchWhatThisDeviceAsked } from '@ValenceClient/downloads/useFetchWhatThisDeviceAsked';
import { sendWatchedOffline } from '@ValenceClient/offline/watchedOffline';
import { TheAlbums } from '@ValenceMobile/components/TheAlbums/TheAlbums';
import { TheArtists } from '@ValenceMobile/components/TheArtists/TheArtists';
import { AMusicPage } from '@ValenceMobile/components/AMusicPage/AMusicPage';
import { TheFloatingPlayer } from '@ValenceMobile/components/TheFloatingPlayer/TheFloatingPlayer';
import { ATelevisionToSignIn } from '@ValenceMobile/components/ATelevisionToSignIn/ATelevisionToSignIn';
import { useLinksIntoTheApp } from '@ValenceMobile/hooks/useLinksIntoTheApp';
import { useMayRequest } from '@ValenceClient/requests/useMayRequest';
import { useCarPlay } from '@ValenceMobile/carPlay/useCarPlay';
import type { ReactNode } from 'react';
import type { Heard } from '@ValenceClient/books/heardLast';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { APage, SignedInProps } from './SignedIn.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const A_SERVER = /^[a-z][a-z0-9+.-]*:\/\/[^/?#\s]+/iu;

const MUSIC_PAGES: ReadonlySet<APage['kind']> = new Set([
  'album',
  'artist',
  'playlist',
  'liked',
  'mix',
  'albums',
  'artists',
]);

const styles = StyleSheet.create({
  over: { ...StyleSheet.absoluteFill },
  above: { gap: 8 },
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
 * When an episode plays to its end the next one follows on its own, running on into the next
 * season at the end of one, as it does on the browser client, until as many have followed as this
 * profile allows — then it asks first, and asks instead of playing rather than over the top of
 * something already started. Choosing an episode by hand starts that count again.
 *
 * It joins presence as soon as somebody is through, which is what puts this phone in the list of
 * open sessions an operator watches and what carries an instruction to stop or pause back to it.
 * Presence is the socket rather than something kept beside one, so a phone that never opened one
 * was a phone the server could see asking for films and never see watching them. The same socket
 * says when anything this phone has asked for has changed, and it is closed once they sign out.
 *
 * The watch party this phone may be in is held here rather than in the player, since an invitation
 * arrives with the notifications and a party outlives any one film being opened. Following one opens
 * the film it is watching, joined, or the music player for a listening party, whose music is kept
 * in step with the host's from then on; somebody put out of a party is told so — over the player
 * where one is open, and otherwise in an alert, so it is not missed.
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
  useCarPlay();
  const cache = useQueryClient();
  const [pages, setPages] = useState<readonly APage[]>([]);
  const [watching, setWatching] = useState<{
    mediaId: string;
    startSeconds: number;
    invitedTo?: string;
  } | null>(null);
  const watchParty = useWatchParty(getRealtimeClient());
  const [listenInvitation, setListenInvitation] = useState<string | null>(null);

  useListenAlong(watchParty, listenInvitation);
  const { notice: partyNotice, forgetNotice: forgetPartyNotice } = watchParty;

  useEffect(() => {
    if (partyNotice === null) {
      return;
    }

    const goes = setTimeout(() => {
      forgetPartyNotice();
    }, PARTY_NOTICE_LINGERS_MS);

    return () => {
      clearTimeout(goes);
    };
  }, [partyNotice, forgetPartyNotice]);
  const [carriedOn, setCarriedOn] = useState(0);
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [tabsHigh, setTabsHigh] = useState(0);
  const settingUp = useQuery(householdQueries.onboarding());
  const [watchingHeld, setWatchingHeld] = useState<HeldFile | null>(null);
  const [askingAbout, setAskingAbout] = useState<MediaSummary | null>(null);
  const isPlayerUp = useRef(false);

  useEffect(() => {
    isPlayerUp.current = watching !== null || watchingHeld !== null;
  });

  useEffect(() => {
    if (partyNotice !== null && !isPlayerUp.current) {
      Alert.alert(say('common.partyMenu.watchParty'), partyNotice);
    }
  }, [partyNotice]);
  const [part, setPart] = useState('home');
  const [searchSide, setSearchSide] = useState('discover');
  const side = part === 'search' || part === 'downloads' || part === 'account' ? part : 'home';
  const holding = useTheProgrammeOfEpisode(watching?.mediaId ?? null);
  const series = useQuery(libraryQueries.show(holding?.libraryId ?? null, holding?.id ?? null));
  const watcher = useQuery(profileQueries.watching());
  const watched = useQuery(viewingQueries.progress());
  const episodes = series.data?.seasons.flatMap((season) => season.episodes) ?? [];
  const mayRequest = useMayRequest();
  const tabs = [
    { id: 'home', label: say('common.home'), icon: Home, symbol: 'house' },
    { id: 'search', label: say('common.search'), icon: Search, symbol: 'magnifyingglass' },
    {
      id: 'downloads',
      label: say('common.downloads'),
      icon: Download,
      symbol: 'arrow.down.circle',
    },
    {
      id: 'account',
      label: say('common.account'),
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

  const join = (invitation: PartyInvitation) => {
    if (invitation.kind === 'listen') {
      setListenInvitation(invitation.partyId);
      open({ kind: 'playing' });

      return;
    }

    setCarriedOn(0);
    setWatching({
      mediaId: invitation.mediaId,
      startSeconds: resumeFor(byMediaId(watched.data ?? []), invitation.mediaId) ?? 0,
      invitedTo: invitation.partyId,
    });
  };

  const stopWatchingIt = () => {
    setWatching(null);
    void cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey });
  };

  const whatFollows = () => {
    const playing = episodes.find((episode) => episode.id === watching?.mediaId) ?? null;

    return decideWhatFollows({
      following: playing === null ? null : nextEpisode(episodes, playing),
      carriedOn,
      askAfter: watcher.data?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
    });
  };

  const whenItEnds = () => {
    const decided = whatFollows();

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

  const [latest] = useState(
    () =>
      new Map<
        'now',
        {
          open: (page: APage) => void;
          lookAt: (mediaId: string) => void;
          lookAtShow: (libraryId: string, showId: string) => void;
          toAlbum: (albumId: string) => void;
          toArtist: (artistId: string) => void;
          onOut: () => void;
          onElsewhere: () => void;
        }
      >(),
  );

  useEffect(() => {
    latest.set('now', { open, lookAt, lookAtShow, toAlbum, toArtist, onOut, onElsewhere });
  });

  const downloadsPage = useCallback(
    (header: ReactNode, onScrolled: (isScrolled: boolean) => void, searchingFor: string) => (
      <TheDownloads
        onWatch={setWatchingHeld}
        header={header}
        onScrolled={onScrolled}
        searchingFor={searchingFor}
      />
    ),
    [],
  );

  const accountPage = useCallback(
    (header: ReactNode, onScrolled: (isScrolled: boolean) => void) => (
      <TheAccount
        header={header}
        onScrolled={onScrolled}
        onOpen={(panel) => {
          latest.get('now')?.open({ kind: 'account', panel });
        }}
        onOut={() => {
          void signOut()
            .then(forgetThePictures)
            .then(() => {
              latest.get('now')?.onOut();
            });
        }}
        onElsewhere={() => {
          latest.get('now')?.onElsewhere();
        }}
      />
    ),
    [latest],
  );

  const searchPage = useCallback(
    (header: ReactNode, searchingFor: string, onScrolled: (isScrolled: boolean) => void) => (
      <TheSearch
        header={header}
        searchingFor={searchingFor}
        onScrolled={onScrolled}
        onSeeAll={(browsing, title) => {
          latest.get('now')?.open({ kind: 'browsing', browsing, title });
        }}
        side={searchSide}
        onSide={setSearchSide}
        onLookAt={(mediaId) => {
          latest.get('now')?.lookAt(mediaId);
        }}
        onLookAtShow={(libraryId, showId) => {
          latest.get('now')?.lookAtShow(libraryId, showId);
        }}
        onAlbum={(albumId) => {
          latest.get('now')?.toAlbum(albumId);
        }}
        onArtist={(artistId) => {
          latest.get('now')?.toArtist(artistId);
        }}
        onPlaylist={(playlistId) => {
          latest.get('now')?.open({ kind: 'playlist', playlistId });
        }}
        onBook={(bookId) => {
          latest.get('now')?.open({ kind: 'book', bookId });
        }}
        onAsk={
          mayRequest
            ? (about, id) => {
                latest.get('now')?.open(pageToAskAbout(cache, about, id));
              }
            : null
        }
      />
    ),
    [cache, latest, mayRequest, searchSide],
  );

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (settingUp.data?.isOnboarded === false) {
    return (
      <ASetUpTheHousehold
        household={settingUp.data.household}
        onDone={() => {
          void cache.invalidateQueries({ queryKey: householdQueries.key });
        }}
      />
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
            onStartParty={(partyMediaId, startSeconds) => {
              watchParty.open(partyMediaId);
              choose(partyMediaId, startSeconds);
            }}
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
      case 'collection':
        return (
          <ACollection
            collectionId={page.collectionId}
            onLookAt={lookAt}
            onLookAtShow={lookAtShow}
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
              swap(pageInTheLibrary(kind, mediaId));
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
              open(pageToAskAbout(cache, about, id));
            }}
            onBack={back}
          />
        );
      case 'notifications':
        return <TheNotifications onOpen={open} onJoin={join} onBack={back} />;
      case 'calendar':
        return <TheCalendar onOpen={open} onBack={back} />;
      case 'account':
        return <TheAccountPage panel={page.panel} onBack={back} />;
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
            isRequestingMissing={page.isRequestingMissing === true}
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
      case 'mix':
        return (
          <AMix
            mixId={page.mixId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onPlaylist={toPlaylist}
            onBack={back}
          />
        );
      case 'playing':
        return (
          <TheMusicPlayer
            onArtist={toArtist}
            onAlbum={toAlbum}
            onBack={back}
            watchParty={watchParty}
          />
        );
      case 'listening':
        return <TheListeningPlayer onBack={back} />;
    }
  };

  const showing = (
    <>
      <ATabPage isShowing>
        <TheLibrary
          side={side}
          downloadsPage={downloadsPage}
          accountPage={accountPage}
          searchPage={searchPage}
          onWatch={choose}
          onLookAt={lookAt}
          onLookAtShow={lookAtShow}
          onNotifications={() => {
            open({ kind: 'notifications' });
          }}
          onScan={() => {
            void scanATelevision();
          }}
          {...(mayRequest
            ? {
                onCalendar: () => {
                  open({ kind: 'calendar' });
                },
                onRequested: () => {
                  setSearchSide('asked');
                  setPart('search');
                },
              }
            : {})}
          onAlbum={toAlbum}
          onArtist={toArtist}
          onPlaylist={(playlistId) => {
            open({ kind: 'playlist', playlistId });
          }}
          onCollection={(collectionId) => {
            open({ kind: 'collection', collectionId });
          }}
          onLiked={() => {
            open({ kind: 'liked' });
          }}
          onMix={(mixId) => {
            open({ kind: 'mix', mixId });
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
      <Watching
        key={watchingHeld.downloadId}
        mediaId={watchingHeld.mediaId}
        kept={watchingHeld}
        onDone={() => {
          setWatchingHeld(null);
        }}
      />
    ) : watching !== null ? (
      <WatchingTogether
        key={watching.mediaId}
        watchParty={watchParty}
        invitedTo={watching.invitedTo ?? null}
        mediaId={watching.mediaId}
        startSeconds={watching.startSeconds}
        onDone={stopWatchingIt}
        onEnded={whenItEnds}
        willCarryOn={whatFollows().kind === 'play'}
        seasons={series.data?.seasons ?? []}
        onChooseEpisode={(chosen) => {
          choose(chosen, resumeFor(byMediaId(watched.data ?? []), chosen) ?? 0);
        }}
      />
    ) : null;
  const isCovered = covering !== null;

  const tabbed = (
    <>
      <TheTabs
        tabs={tabs}
        value={part}
        onSelect={setPart}
        {...(onFaceAt === undefined ? {} : { onFaceAt })}
        isFaceArriving={isFaceArriving}
        onBarHeight={setTabsHigh}
        above={
          <View style={styles.above}>
            <AVideoRemoteBar
              onOpen={() => {
                setIsRemoteOpen(true);
              }}
            />
            <TheNowPlayingBar onOpen={openWhatIsHeard} isRoomOnly />
          </View>
        }
      >
        {showing}
      </TheTabs>

      <AVideoRemote
        isOpen={isRemoteOpen}
        onClose={() => {
          setIsRemoteOpen(false);
        }}
        onPlayHere={choose}
      />
    </>
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
        <TheAudiobookRemote />
        <TheFloatingPlayer
          isShown={pages.length === 0 || MUSIC_PAGES.has(pages.at(-1)?.kind ?? 'playing')}
          liftedBy={pages.length === 0 ? tabsHigh : 0}
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
