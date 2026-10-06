import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { MusicMixListSchema, MusicMixSchema } from '@ValenceContracts/schemas/MusicMix';
import type { MusicMix, MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';

/**
 * Reads the mixes Valence has made for this profile today.
 *
 * @returns The mixes, the personal ones first.
 */
const fetchMixes = async (): Promise<MusicMixSummary[]> =>
  (await readFromServer('/api/music/mixes', MusicMixListSchema, profileHeaders())).mixes;

/**
 * Reads one of today's mixes, with its songs.
 *
 * @param mixId - Which mix.
 * @returns The mix.
 */
const fetchMix = (mixId: string): Promise<MusicMix> =>
  readFromServer(`/api/music/mixes/${encodeURIComponent(mixId)}`, MusicMixSchema, profileHeaders());

export { fetchMix, fetchMixes };
