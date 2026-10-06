type MusicView =
  | { kind: 'home' }
  | { kind: 'album'; id: string }
  | { kind: 'artist'; id: string }
  | { kind: 'playlist'; id: string; isRequestingMissing?: boolean }
  | { kind: 'liked' }
  | { kind: 'mix'; id: string }
  | { kind: 'albums' }
  | { kind: 'artists' }
  | { kind: 'playlists' }
  | { kind: 'search'; query: string }
  | { kind: 'lyrics' };

const HOME: MusicView = { kind: 'home' };

const REQUESTING = ':request';

/**
 * Reads which part of the music section an address is showing.
 *
 * One value in the address carries it — "album:…", "artist:…", "mix:…", "search:…" — so every page of the
 * section can be linked to, bookmarked and gone back to, without the router needing a path for
 * each of them. A playlist's ends ":request" where its missing songs are being requested, which is
 * where the notice that their albums were found leads.
 *
 * @param listen - The value in the address, where there is one.
 * @returns The view.
 */
const readMusicView = (listen: string | null): MusicView => {
  if (listen === null || listen === '') {
    return HOME;
  }

  const split = listen.indexOf(':');
  const kind = split === -1 ? listen : listen.slice(0, split);
  const rest = split === -1 ? '' : listen.slice(split + 1);

  if (
    kind === 'liked' ||
    kind === 'lyrics' ||
    kind === 'albums' ||
    kind === 'artists' ||
    kind === 'playlists'
  ) {
    return { kind };
  }

  if (kind === 'search') {
    return { kind: 'search', query: rest };
  }

  if (kind === 'playlist' && rest.endsWith(REQUESTING) && rest !== REQUESTING) {
    return { kind, id: rest.slice(0, -REQUESTING.length), isRequestingMissing: true };
  }

  if (
    (kind === 'album' || kind === 'artist' || kind === 'playlist' || kind === 'mix') &&
    rest !== ''
  ) {
    return { kind, id: rest };
  }

  return HOME;
};

/**
 * Writes a view of the music section as the value an address carries.
 *
 * @param view - The view.
 * @returns The value, or nothing for the section's front page.
 */
const writeMusicView = (view: MusicView): string | null => {
  if (view.kind === 'home') {
    return null;
  }

  if (
    view.kind === 'liked' ||
    view.kind === 'lyrics' ||
    view.kind === 'albums' ||
    view.kind === 'artists' ||
    view.kind === 'playlists'
  ) {
    return view.kind;
  }

  if (view.kind === 'search') {
    return `search:${view.query}`;
  }

  if (view.kind === 'playlist' && view.isRequestingMissing === true) {
    return `playlist:${view.id}${REQUESTING}`;
  }

  return `${view.kind}:${view.id}`;
};

export type { MusicView };

export { readMusicView, writeMusicView };
