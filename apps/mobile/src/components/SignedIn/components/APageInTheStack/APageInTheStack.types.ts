import type { Heard } from '@ValenceClient/books/heardLast';
import type { PartyInvitation } from '@ValenceClient/party/readPartyInvitation';
import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { APage } from '@ValenceMobile/components/SignedIn/SignedIn.types';

type TheWaysOut = {
  open: (page: APage) => void;
  swap: (page: APage) => void;
  back: () => void;
  watch: (mediaId: string, startSeconds: number) => void;
  watchFromWhereLeft: (mediaId: string) => void;
  watchTogether: (mediaId: string, startSeconds: number) => void;
  watchHeld: (file: HeldFile) => void;
  join: (invitation: PartyInvitation) => void;
  lookAt: (mediaId: string) => void;
  lookAtShow: (libraryId: string, showId: string) => void;
  askAbout: (about: MediaRequestKind, id: string) => void;
  requestMore: (tmdbId: number) => void;
  toAlbum: (albumId: string) => void;
  toArtist: (artistId: string) => void;
  toPlaylist: (playlistId: string) => void;
  toTheVideoRemote: () => void;
  toTheListeningPlayer: () => void;
  openWhatIsHeard: (heard: Heard) => void;
  signOut: () => void;
  goElsewhere: () => void;
};

type APageInTheStackProps = {
  page: APage;
  ways: TheWaysOut;
  isCovered: boolean;
  mayRequest: boolean;
  watchParty: WatchPartyState | null;
};

export type { APageInTheStackProps, TheWaysOut };
