import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { CircleUser, Download, House, Search } from 'lucide-react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
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
import { AnAskable } from '@ValencePhone/components/AnAskable/AnAskable';
import { APerson } from '@ValencePhone/components/APerson/APerson';
import { AShow } from '@ValencePhone/components/AShow/AShow';
import { ATitle } from '@ValencePhone/components/ATitle/ATitle';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { StillWatching } from '@ValencePhone/components/StillWatching/StillWatching';
import { AnAlbum } from '@ValencePhone/components/AnAlbum/AnAlbum';
import { AnArtist } from '@ValencePhone/components/AnArtist/AnArtist';
import { APlaylist } from '@ValencePhone/components/APlaylist/APlaylist';
import { TheLikedSongs } from '@ValencePhone/components/TheLikedSongs/TheLikedSongs';
import { TheMusicPlayer } from '@ValencePhone/components/TheMusicPlayer/TheMusicPlayer';
import { TheNowPlayingBar } from '@ValencePhone/components/TheNowPlayingBar/TheNowPlayingBar';
import { TheAccount } from '@ValencePhone/components/TheAccount/TheAccount';
import { TheDownloads } from '@ValencePhone/components/TheDownloads/TheDownloads';
import { TheLibrary } from '@ValencePhone/components/TheLibrary/TheLibrary';
import { TheNotifications } from '@ValencePhone/components/TheNotifications/TheNotifications';
import { TheSearch } from '@ValencePhone/components/TheSearch/TheSearch';
import { TheTabs } from '@ValencePhone/components/TheTabs/TheTabs';
import { useTheProgrammeOf } from '@ValencePhone/components/SignedIn/useTheProgrammeOf';
import { useTheProgrammeOfEpisode } from '@ValencePhone/hooks/useTheProgrammeOfEpisode';
import { Watching } from '@ValencePhone/components/Watching/Watching';
import { WatchingHeld } from '@ValencePhone/components/WatchingHeld/WatchingHeld';
import { useFetchWhatThisPhoneAskedFor } from '@ValencePhone/downloads/useFetchWhatThisPhoneAskedFor';
import { useTellTheServerWhatIsHeld } from '@ValenceClient/downloads/useTellTheServerWhatIsHeld';
import { sendWatchedOffline } from '@ValenceClient/offline/watchedOffline';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { APage, SignedInProps } from './SignedIn.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

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
 * was a phone the server could see asking for films and never see watching them.
 *
 * Waits for the session before drawing any of it, because every request they make depends on being
 * signed in and a library drawn first would ask a question it cannot have the answer to.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());

  useEffect(() => watchPresence(), []);
  useEffect(() => {
    void sendWatchedOffline();
  }, []);
  useTellTheServerWhatIsHeld();
  useFetchWhatThisPhoneAskedFor();
  const cache = useQueryClient();
  const [pages, setPages] = useState<readonly APage[]>([]);
  const [watching, setWatching] = useState<{ mediaId: string; startSeconds: number } | null>(null);
  const [carriedOn, setCarriedOn] = useState(0);
  const [watchingHeld, setWatchingHeld] = useState<HeldFile | null>(null);
  const [askingAbout, setAskingAbout] = useState<MediaSummary | null>(null);
  const [part, setPart] = useState('home');
  const top = pages.at(-1) ?? null;
  const sought = useTheProgrammeOf(top?.kind === 'series' ? top.seriesId : null);
  const holding = useTheProgrammeOfEpisode(watching?.mediaId ?? null);
  const series = useQuery(libraryQueries.show(holding?.libraryId ?? null, holding?.id ?? null));
  const watcher = useQuery(profileQueries.watching());
  const watched = useQuery(viewingQueries.progress());
  const episodes = series.data?.seasons.flatMap((season) => season.episodes) ?? [];
  const requesting = useQuery(requestsQueries.availability());
  const { may } = useWhatIMayDo();
  const mayRequest = requesting.data?.isEnabled === true && may('requests.ask');
  const tabs = [
    { id: 'home', label: 'Home', icon: House, symbol: 'house' },
    { id: 'search', label: 'Search', icon: Search, symbol: 'magnifyingglass' },
    { id: 'downloads', label: 'Downloads', icon: Download, symbol: 'arrow.down.circle' },
    { id: 'account', label: 'Account', icon: CircleUser, symbol: 'person.crop.circle' },
  ];

  const open = (page: APage) => {
    setPages((was) => [...was, page]);
  };

  const toAlbum = (albumId: string) => {
    open({ kind: 'album', albumId });
  };

  const toArtist = (artistId: string) => {
    open({ kind: 'artist', artistId });
  };

  const back = () => {
    setPages((was) => was.slice(0, -1));
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

  if (askingAbout !== null) {
    return (
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
    );
  }

  if (watchingHeld !== null) {
    return (
      <WatchingHeld
        file={watchingHeld}
        onDone={() => {
          setWatchingHeld(null);
        }}
      />
    );
  }

  if (watching !== null) {
    return (
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
    );
  }

  if (top !== null) {
    switch (top.kind) {
      case 'title':
        return (
          <ATitle
            key={`${pages.length.toString()}:${top.mediaId}`}
            mediaId={top.mediaId}
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
            key={`${pages.length.toString()}:${top.showId}`}
            libraryId={top.libraryId}
            showId={top.showId}
            onWatch={choose}
            onLookAt={lookAt}
            onBack={back}
          />
        );
      case 'series':
        return sought === null ? (
          <Screen centres onBack={back}>
            <ActivityIndicator />
          </Screen>
        ) : (
          <AShow
            key={`${pages.length.toString()}:${sought.showId}`}
            libraryId={sought.libraryId}
            showId={sought.showId}
            onWatch={choose}
            onLookAt={lookAt}
            onBack={back}
          />
        );
      case 'person':
        return (
          <APerson
            key={`${pages.length.toString()}:${top.personId.toString()}`}
            personId={top.personId}
            onLookAt={lookAt}
            onLookAtShow={lookAtShow}
            onBack={back}
          />
        );
      case 'asking':
        return (
          <AnAskable
            key={`${pages.length.toString()}:${top.about}:${top.id}`}
            kind={top.about}
            id={top.id}
            onOpen={(kind, mediaId) => {
              open(
                kind === 'film'
                  ? { kind: 'title', mediaId }
                  : { kind: 'series', seriesId: mediaId },
              );
            }}
            onBack={back}
          />
        );
      case 'notifications':
        return <TheNotifications onOpen={open} onBack={back} />;
      case 'album':
        return (
          <AnAlbum
            key={`${pages.length.toString()}:${top.albumId}`}
            albumId={top.albumId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onBack={back}
          />
        );
      case 'artist':
        return (
          <AnArtist
            key={`${pages.length.toString()}:${top.artistId}`}
            artistId={top.artistId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onBack={back}
          />
        );
      case 'playlist':
        return (
          <APlaylist
            key={`${pages.length.toString()}:${top.playlistId}`}
            playlistId={top.playlistId}
            onAlbum={toAlbum}
            onArtist={toArtist}
            onBack={back}
          />
        );
      case 'liked':
        return <TheLikedSongs onAlbum={toAlbum} onArtist={toArtist} onBack={back} />;
      case 'playing':
        return <TheMusicPlayer onArtist={toArtist} onBack={back} />;
    }
  }

  const showing =
    part === 'downloads' ? (
      <TheDownloads onWatch={setWatchingHeld} />
    ) : part === 'account' ? (
      <TheAccount
        onOut={() => {
          void signOut().then(onOut);
        }}
      />
    ) : part === 'search' ? (
      <TheSearch
        onLookAt={lookAt}
        onLookAtShow={lookAtShow}
        onAsk={
          mayRequest
            ? (about, id) => {
                open({ kind: 'asking', about, id });
              }
            : null
        }
      />
    ) : (
      <TheLibrary
        onWatch={choose}
        onLookAt={lookAt}
        onLookAtShow={lookAtShow}
        onNotifications={() => {
          open({ kind: 'notifications' });
        }}
        onAlbum={toAlbum}
        onArtist={toArtist}
        onPlaylist={(playlistId) => {
          open({ kind: 'playlist', playlistId });
        }}
        onLiked={() => {
          open({ kind: 'liked' });
        }}
      />
    );

  return (
    <TheTabs
      tabs={tabs}
      value={part}
      onSelect={setPart}
      above={
        <TheNowPlayingBar
          onOpen={() => {
            open({ kind: 'playing' });
          }}
        />
      }
    >
      {showing}
    </TheTabs>
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };
