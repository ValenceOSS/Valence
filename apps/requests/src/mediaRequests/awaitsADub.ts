import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import type { AnimeAudioPolicy } from '@ValenceContracts/schemas/AnimeAudioPolicy';

/**
 * Whether what was fetched of an anime is still waiting on a dub: the show takes subtitles until a
 * dub comes, and what was fetched has none.
 *
 * @param policy - The speech the show is wanted in.
 * @param filedTitle - The name of what was fetched.
 * @returns Whether a dub should still be looked for.
 */
const awaitsADub = (policy: AnimeAudioPolicy, filedTitle: string): boolean => {
  const spoken = parseReleaseName(filedTitle).spokenAudio ?? 'subbed';

  return policy === 'subbedUntilDubbed' && spoken !== 'dubbed' && spoken !== 'dual';
};

export { awaitsADub };
