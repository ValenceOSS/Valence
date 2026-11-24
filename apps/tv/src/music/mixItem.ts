import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

/**
 * A mix Valence made as a tile: the cover of the first album in it, its name, and what it is made
 * of.
 *
 * @param mix - The mix.
 * @returns The tile's item.
 */
const mixItem = (mix: MusicMixSummary): MusicItem => {
  const cover = mix.coverAlbumIds[0];

  return {
    kind: 'mix',
    id: mix.id,
    title: mix.title,
    detail: mix.detail,
    art: cover === undefined ? null : albumArtworkUrl(cover),
    view: { kind: 'mix', id: mix.id },
  };
};

export { mixItem };
