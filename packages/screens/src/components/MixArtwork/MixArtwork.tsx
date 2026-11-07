import { useQuery } from '@tanstack/react-query';
import { Logo } from '@ValenceUI/Logo';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { pictureOf } from '@ValenceScreens/components/ArtistShelf/ArtistShelf';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import type { MixArtworkProps } from './MixArtwork.types';
import { say } from '@ValenceI18n/say';

const COLOURS = 6;

const WORDS = '@container relative block aspect-square w-full overflow-hidden rounded-xl';

/**
 * Which of the mix colours belongs to a mix, the same one every time it is drawn.
 *
 * @param id - The mix.
 * @returns The colour, as CSS can read it.
 */
const colourOf = (id: string): string => {
  const at = [...id].reduce((sum, letter) => (sum * 31 + letter.charCodeAt(0)) % 9973, 7);

  return `var(--mix-colour-${((at % COLOURS) + 1).toString()})`;
};

/**
 * The picture Valence makes for a mix out of the artists in it. A daily mix is its main artist with
 * its number in a pair of labels; a station is three of its artists in circles on a colour with who
 * it is named for beneath them; anything else is its main artist with its name along a band. The
 * colour comes from the mix, so each one stays recognisable from day to day, and the Valence mark
 * in its corner is in that colour too.
 *
 * @param mix - The mix.
 * @param number - Which daily mix this is, counting from one.
 */
const MixArtwork = ({ mix, number = 1 }: MixArtworkProps) => {
  const artists = useQuery(musicQueries.artists());
  const colour = colourOf(mix.id);
  const label = mix.title;

  const pictures = mix.faces.map((face) => {
    const artist = artists.data?.find((one) => one.id === face.id);
    const own = artist === undefined ? null : pictureOf(artist);

    return {
      id: face.id,
      name: face.name,
      src: own ?? (face.albumId === null ? null : albumArtworkUrl(face.albumId)),
    };
  });
  const firstAlbum = mix.coverAlbumIds[0];
  const lead = pictures[0]?.src ?? (firstAlbum === undefined ? null : albumArtworkUrl(firstAlbum));
  const mark = (
    <span className="absolute left-[4.5cqi] top-[4.5cqi] flex h-[6.5cqi]" style={{ color: colour }}>
      <Logo isCurrentColour className="h-full" />
    </span>
  );

  if (mix.kind === 'station') {
    const [first, second, third] = pictures;
    const circles = [
      { face: second, place: 'left-[-8%] top-[20%] w-[38%]' },
      { face: third, place: 'right-[-8%] top-[20%] w-[38%]' },
      { face: first, place: 'left-1/2 top-[12%] w-[52%] -translate-x-1/2' },
    ];

    return (
      <span role="img" aria-label={label} className={WORDS} style={{ backgroundColor: colour }}>
        {mark}

        {circles.map(({ face, place }, at) =>
          face === undefined ? null : (
            <span
              key={`${face.id}-${at.toString()}`}
              className={`absolute block rounded-full p-[1.5cqi] ${place}`}
              style={{ backgroundColor: colour }}
            >
              <MusicArtwork src={face.src} label={face.name} shape="round" className="w-full" />
            </span>
          ),
        )}

        <span className="absolute right-[5cqi] top-[4cqi] text-[4.5cqi] font-bold uppercase tracking-[0.12em] text-shade">
          {say('screens.mixArtwork.station')}
        </span>

        <span className="absolute inset-x-[5cqi] bottom-[5cqi] line-clamp-2 text-[11cqi] font-bold leading-[1.02] tracking-[-0.03em] text-shade">
          {mix.title}
        </span>
      </span>
    );
  }

  if (mix.kind === 'daily') {
    return (
      <span role="img" aria-label={label} className={WORDS}>
        <MusicArtwork src={lead} label={label} className="absolute inset-0 w-full" />
        {mark}

        <span className="absolute inset-x-[4cqi] bottom-[4cqi] flex items-end justify-between gap-[2cqi]">
          <span
            className="px-[2.5cqi] py-[1cqi] text-[8cqi] font-bold leading-none tracking-[-0.02em] text-shade"
            style={{ backgroundColor: colour }}
          >
            {say('screens.mixArtwork.dailyMix')}
          </span>
          <span
            className="px-[2.5cqi] py-[1cqi] text-[15cqi] font-bold leading-none tracking-[-0.03em] tabular-nums text-shade"
            style={{ backgroundColor: colour }}
          >
            {number.toString().padStart(2, '0')}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} className={WORDS}>
      <MusicArtwork src={lead} label={label} className="absolute inset-0 w-full" />
      {mark}

      <span className="absolute inset-x-0 bottom-[5cqi] flex gap-[3.5cqi]">
        <span className="w-[3.5cqi] shrink-0" style={{ backgroundColor: colour }} />
        <span
          className="min-w-0 flex-1 truncate px-[2.5cqi] py-[1.25cqi] text-[8.5cqi] font-bold leading-[1.15] tracking-[-0.02em] text-shade"
          style={{ backgroundColor: colour }}
        >
          {mix.title}
        </span>
      </span>
    </span>
  );
};

MixArtwork.displayName = 'MixArtwork';

export { MixArtwork };
