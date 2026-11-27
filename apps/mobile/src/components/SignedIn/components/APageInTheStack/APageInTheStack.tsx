import { memo } from 'react';
import { ABook } from '@ValenceMobile/components/ABook/ABook';
import { ACatalogueList } from '@ValenceMobile/components/ACatalogueList/ACatalogueList';
import { ACollection } from '@ValenceMobile/components/ACollection/ACollection';
import { AMix } from '@ValenceMobile/components/AMix/AMix';
import { AMusicPage } from '@ValenceMobile/components/AMusicPage/AMusicPage';
import { AnAlbum } from '@ValenceMobile/components/AnAlbum/AnAlbum';
import { AnArtist } from '@ValenceMobile/components/AnArtist/AnArtist';
import { AnAskable } from '@ValenceMobile/components/AnAskable/AnAskable';
import { APerson } from '@ValenceMobile/components/APerson/APerson';
import { APlaylist } from '@ValenceMobile/components/APlaylist/APlaylist';
import { AReader } from '@ValenceMobile/components/AReader/AReader';
import { AShow } from '@ValenceMobile/components/AShow/AShow';
import { ATelevisionToSignIn } from '@ValenceMobile/components/ATelevisionToSignIn/ATelevisionToSignIn';
import { ATitle } from '@ValenceMobile/components/ATitle/ATitle';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { AProgrammeBySeries } from '@ValenceMobile/components/SignedIn/components/AProgrammeBySeries/AProgrammeBySeries';
import { UnderThePlayer } from '@ValenceMobile/components/SignedIn/components/UnderThePlayer/UnderThePlayer';
import { MUSIC_PAGES } from '@ValenceMobile/components/SignedIn/MUSIC_PAGES';
import { pageInTheLibrary } from '@ValenceMobile/components/SignedIn/pageInTheLibrary';
import { TheAccount } from '@ValenceMobile/components/TheAccount/TheAccount';
import { TheAccountPage } from '@ValenceMobile/components/TheAccountPage/TheAccountPage';
import { TheAlbums } from '@ValenceMobile/components/TheAlbums/TheAlbums';
import { TheArtists } from '@ValenceMobile/components/TheArtists/TheArtists';
import { TheCalendar } from '@ValenceMobile/components/TheCalendar/TheCalendar';
import { TheDownloads } from '@ValenceMobile/components/TheDownloads/TheDownloads';
import { TheLikedSongs } from '@ValenceMobile/components/TheLikedSongs/TheLikedSongs';
import { TheListeningPlayer } from '@ValenceMobile/components/TheListeningPlayer/TheListeningPlayer';
import { TheMusicPlayer } from '@ValenceMobile/components/TheMusicPlayer/TheMusicPlayer';
import { TheNotifications } from '@ValenceMobile/components/TheNotifications/TheNotifications';
import { Asked } from '@ValenceMobile/components/TheSearch/components/Asked/Asked';
import { TheVideoRemote } from '@ValenceMobile/components/TheVideoRemote/TheVideoRemote';
import { Words } from '@ValenceMobile/components/Words/Words';
import { say } from '@ValenceI18n/say';
import type { ReactNode } from 'react';
import type { APageInTheStackProps } from './APageInTheStack.types';

/**
 * Draws what a page of the stack shows, wired to the ways out of it.
 *
 * @param props - The page, the ways out of it and what it is drawn under.
 * @returns What it shows.
 */
const whatItShows = ({ page, ways, mayRequest, watchParty }: APageInTheStackProps): ReactNode => {
  switch (page.kind) {
    case 'title':
      return (
        <ATitle
          mediaId={page.mediaId}
          onWatch={ways.watch}
          onLookAt={ways.lookAt}
          onLookAtPerson={(personId) => {
            ways.open({ kind: 'person', personId });
          }}
          onLookAtShow={ways.lookAtShow}
          onBack={ways.back}
          onToTheRemote={ways.toTheVideoRemote}
          onStartParty={ways.watchTogether}
        />
      );
    case 'show':
      return (
        <AShow
          libraryId={page.libraryId}
          showId={page.showId}
          onWatch={ways.watch}
          onLookAt={ways.lookAt}
          onLookAtShow={ways.lookAtShow}
          onBack={ways.back}
          onRequestMore={ways.requestMore}
          onToTheRemote={ways.toTheVideoRemote}
        />
      );
    case 'series':
      return (
        <AProgrammeBySeries
          seriesId={page.seriesId}
          onWatch={ways.watch}
          onLookAt={ways.lookAt}
          onLookAtShow={ways.lookAtShow}
          onBack={ways.back}
          onRequestMore={ways.requestMore}
        />
      );
    case 'collection':
      return (
        <ACollection
          collectionId={page.collectionId}
          onLookAt={ways.lookAt}
          onLookAtShow={ways.lookAtShow}
          onBack={ways.back}
        />
      );
    case 'person':
      return (
        <APerson
          personId={page.personId}
          onLookAt={ways.lookAt}
          onLookAtShow={ways.lookAtShow}
          onAsk={ways.askAbout}
          onBack={ways.back}
        />
      );
    case 'asking':
      return (
        <AnAskable
          kind={page.about}
          id={page.id}
          isMore={page.isMore === true}
          onOpen={(kind, mediaId) => {
            ways.swap(pageInTheLibrary(kind, mediaId));
          }}
          onAskAbout={ways.askAbout}
          onPlay={ways.watchFromWhereLeft}
          onLookAtPerson={(personId) => {
            ways.open({ kind: 'person', personId });
          }}
          onBack={ways.back}
        />
      );
    case 'browsing':
      return (
        <ACatalogueList
          browsing={page.browsing}
          title={page.title}
          onAsk={ways.askAbout}
          onBack={ways.back}
        />
      );
    case 'calendar':
      return <TheCalendar onOpen={ways.open} onBack={ways.back} />;
    case 'downloads':
      return (
        <TheDownloads
          onWatch={ways.watchHeld}
          onPlaying={ways.openWhatIsHeard}
          onBack={ways.back}
        />
      );
    case 'requests':
      return (
        <Screen scrolls title={say('common.requests')} onBack={ways.back}>
          <Words size="title">{say('common.requests')}</Words>
          <Asked onAsk={ways.askAbout} />
        </Screen>
      );
    case 'inbox':
      return <TheNotifications onOpen={ways.open} onJoin={ways.join} onBack={ways.back} />;
    case 'me':
      return (
        <TheAccount
          onBack={ways.back}
          onOpen={(panel) => {
            ways.open({ kind: 'account', panel });
          }}
          onDownloads={() => {
            ways.open({ kind: 'downloads' });
          }}
          {...(mayRequest
            ? {
                onRequests: () => {
                  ways.open({ kind: 'requests' });
                },
              }
            : {})}
          onInbox={() => {
            ways.open({ kind: 'inbox' });
          }}
          onOut={ways.signOut}
          onElsewhere={ways.goElsewhere}
        />
      );
    case 'account':
      return <TheAccountPage panel={page.panel} onBack={ways.back} />;
    case 'album':
      return (
        <AnAlbum
          albumId={page.albumId}
          onAlbum={ways.toAlbum}
          onArtist={ways.toArtist}
          onPlaylist={ways.toPlaylist}
          onBack={ways.back}
        />
      );
    case 'artist':
      return (
        <AnArtist
          artistId={page.artistId}
          onAlbum={ways.toAlbum}
          onArtist={ways.toArtist}
          onPlaylist={ways.toPlaylist}
          onBack={ways.back}
        />
      );
    case 'playlist':
      return (
        <APlaylist
          playlistId={page.playlistId}
          isRequestingMissing={page.isRequestingMissing === true}
          onAlbum={ways.toAlbum}
          onArtist={ways.toArtist}
          onBack={ways.back}
        />
      );
    case 'book':
      return (
        <ABook
          bookId={page.bookId}
          onRead={(bookId, chapterId, isFromTheStart) => {
            ways.open({ kind: 'reading', bookId, chapterId, isFromTheStart });
          }}
          onListen={ways.toTheListeningPlayer}
          onAskAbout={ways.askAbout}
          onBack={ways.back}
        />
      );
    case 'reading':
      return (
        <AReader
          bookId={page.bookId}
          chapterId={page.chapterId}
          isFromTheStart={page.isFromTheStart}
          onBack={ways.back}
        />
      );
    case 'television':
      return <ATelevisionToSignIn code={page.code} askedFrom={page.askedFrom} onBack={ways.back} />;
    case 'albums':
      return <TheAlbums onAlbum={ways.toAlbum} onBack={ways.back} />;
    case 'artists':
      return <TheArtists onArtist={ways.toArtist} onBack={ways.back} />;
    case 'liked':
      return (
        <TheLikedSongs
          onAlbum={ways.toAlbum}
          onArtist={ways.toArtist}
          onPlaylist={ways.toPlaylist}
          onBack={ways.back}
        />
      );
    case 'mix':
      return (
        <AMix
          mixId={page.mixId}
          onAlbum={ways.toAlbum}
          onArtist={ways.toArtist}
          onPlaylist={ways.toPlaylist}
          onBack={ways.back}
        />
      );
    case 'playing':
      return (
        <TheMusicPlayer
          onArtist={ways.toArtist}
          onAlbum={ways.toAlbum}
          onBack={ways.back}
          {...(watchParty === null ? {} : { watchParty })}
        />
      );
    case 'listening':
      return <TheListeningPlayer onBack={ways.back} />;
    case 'remote':
      return <TheVideoRemote onBack={ways.back} onPlayHere={ways.watch} />;
  }
};

/**
 * One page of the stack somebody signed in has opened, drawn under the player and, for music, as
 * music is drawn.
 *
 * @param page - Which page.
 * @param ways - The ways out of it, which stay the same from one drawing to the next.
 * @param isCovered - Whether the player is over it.
 * @param mayRequest - Whether this server lets them ask for things.
 * @param watchParty - The party the music player follows, handed only to the music player.
 */
const OnePage = (props: APageInTheStackProps) => (
  <UnderThePlayer isCovered={props.isCovered}>
    {MUSIC_PAGES.has(props.page.kind) ? (
      <AMusicPage>{whatItShows(props)}</AMusicPage>
    ) : (
      whatItShows(props)
    )}
  </UnderThePlayer>
);

const APageInTheStack = memo(OnePage);

APageInTheStack.displayName = 'APageInTheStack';

export { APageInTheStack };
