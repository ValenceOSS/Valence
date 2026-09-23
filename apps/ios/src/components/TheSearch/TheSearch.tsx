import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { Asked } from '@ValencePhone/components/TheSearch/components/Asked/Asked';
import { Discovered } from '@ValencePhone/components/TheSearch/components/Discovered/Discovered';
import { TheResults } from '@ValencePhone/components/TheSearch/components/TheResults/TheResults';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { TheBookResults } from '@ValencePhone/components/TheSearch/components/TheBookResults/TheBookResults';
import { TheMusicResults } from '@ValencePhone/components/TheSearch/components/TheMusicResults/TheMusicResults';
import type { TheSearchProps } from './TheSearch.types';

const HOLD_STILL_FOR = 250;

const KINDS = [
  { id: 'everything', label: 'Everything' },
  { id: 'films', label: 'Films' },
  { id: 'shows', label: 'Shows' },
] as const;

const MUSIC = { id: 'music', label: 'Music' } as const;

const BOOKS = { id: 'books', label: 'Books' } as const;

const SIDES = [
  { id: 'discover', label: 'Discover' },
  { id: 'asked', label: 'Requested' },
] as const;

/**
 * Looks through every library at once, as the web's search does, for everything or for films,
 * programmes, music or books alone — and, for somebody who may ask for things, through the catalogue for what the
 * library does not have yet.
 *
 * Before anything is typed it is where somebody who may ask for things finds something new — what
 * is trending, popular and coming — and follows what has been asked for until it arrives, so that
 * looking for a film is one place whether or not the server has it.
 *
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 * @param onAsk - Told to open something to ask for, or null for somebody who may not.
 * @param onAlbum - Told which album to open, from what music matched.
 * @param onArtist - Told which artist to open.
 * @param onPlaylist - Told which playlist to open.
 * @param onBook - Told which book to open, from what books matched.
 */
const TheSearch = ({
  onLookAt,
  onLookAtShow,
  onAsk,
  onAlbum,
  onArtist,
  onPlaylist,
  onBook,
}: TheSearchProps) => {
  const libraries = useQuery(libraryQueries.all());
  const watched = useQuery(viewingQueries.progress());
  const [typed, setTyped] = useState('');
  const [kind, setKind] = useState<string>('everything');
  const [side, setSide] = useState<string>('discover');
  const searchingFor = useSettled(typed.trim(), HOLD_STILL_FOR);
  const howFar = byMediaId(watched.data ?? []);
  const watchable = (libraries.data ?? [])
    .filter((library) => library.kind === 'movies' || library.kind === 'shows')
    .map((library) => library.id);
  const hasMusic = (libraries.data ?? []).some((library) => library.kind === 'music');
  const hasBooks = (libraries.data ?? []).some((library) => library.kind === 'books');

  return (
    <Screen scrolls>
      <Words size="title">Search</Words>

      <TextField
        label="Search"
        value={typed}
        onValueChange={setTyped}
        placeholder={[
          'Films, programmes, people',
          ...(hasMusic ? ['music'] : []),
          ...(hasBooks ? ['books'] : []),
        ].join(', ')}
        keyboard="search"
      />

      {searchingFor === '' ? (
        onAsk === null ? (
          <Words tone="muted">Everything in every library.</Words>
        ) : (
          <>
            <SegmentedRow label="What to show" items={SIDES} value={side} onSelect={setSide} />

            {side === 'asked' ? <Asked onAsk={onAsk} /> : <Discovered onAsk={onAsk} />}
          </>
        )
      ) : (
        <>
          <SegmentedRow
            label="What to look for"
            items={[...KINDS, ...(hasMusic ? [MUSIC] : []), ...(hasBooks ? [BOOKS] : [])]}
            value={kind}
            onSelect={setKind}
          />

          {kind === 'music' || kind === 'books' ? null : (
            <TheResults
              asked={searchingFor}
              kind={kind === 'films' || kind === 'shows' ? kind : null}
              libraryIds={watchable}
              howFarThrough={(mediaId) => {
                const known = howFar.get(mediaId);

                return known === undefined ? 0 : watchedFraction(known);
              }}
              onLookAt={onLookAt}
              onLookAtShow={onLookAtShow}
              onAsk={onAsk}
            />
          )}

          {hasMusic && (kind === 'everything' || kind === 'music') ? (
            <TheMusicResults
              asked={searchingFor}
              isOnItsOwn={kind === 'music'}
              onAlbum={onAlbum}
              onArtist={onArtist}
              onPlaylist={onPlaylist}
            />
          ) : null}

          {hasBooks && (kind === 'everything' || kind === 'books') ? (
            <TheBookResults asked={searchingFor} isOnItsOwn={kind === 'books'} onBook={onBook} />
          ) : null}
        </>
      )}
    </Screen>
  );
};

TheSearch.displayName = 'TheSearch';

export { TheSearch };
