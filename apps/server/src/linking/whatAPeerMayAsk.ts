import type { z } from 'zod';
import type { MediaRequestAskSchema } from '@ValenceContracts/schemas/MediaRequest';

type Asked = z.output<typeof MediaRequestAskSchema>;

/**
 * Keeps of a request only what a linked server may ask for: which title and which of its seasons,
 * asked for plainly, so it waits for this server's administrator like anybody else's.
 *
 * @param asked - The request as it arrived.
 * @returns The request a linked server may make.
 */
const whatAPeerMayAsk = (asked: Asked): Asked => ({
  kind: asked.kind,
  ...(asked.tmdbId === undefined ? {} : { tmdbId: asked.tmdbId }),
  seasons: asked.seasons,
  followsNewSeasons: asked.followsNewSeasons,
  isPickedByHand: false,
  origin: 'asked',
});

export { whatAPeerMayAsk };
