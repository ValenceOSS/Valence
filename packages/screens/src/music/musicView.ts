type MusicView =
  | { kind: 'home' }
  | { kind: 'album'; id: string }
  | { kind: 'artist'; id: string }
  | { kind: 'playlist'; id: string }
  | { kind: 'liked' }
  | { kind: 'search'; query: string }
  | { kind: 'lyrics' };

const HOME: MusicView = { kind: 'home' };

/**
 * Reads which part of the music section an address is showing.
 *
 * One value in the address carries it — "album:…", "artist:…", "search:…" — so every page of the
 * section can be linked to, bookmarked and gone back to, without the router needing a path for
 * each of them.
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

  if (kind === 'liked' || kind === 'lyrics') {
    return { kind };
  }

  if (kind === 'search') {
    return { kind: 'search', query: rest };
  }

  if ((kind === 'album' || kind === 'artist' || kind === 'playlist') && rest !== '') {
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

  if (view.kind === 'liked' || view.kind === 'lyrics') {
    return view.kind;
  }

  if (view.kind === 'search') {
    return `search:${view.query}`;
  }

  return `${view.kind}:${view.id}`;
};

export type { MusicView };

export { readMusicView, writeMusicView };
