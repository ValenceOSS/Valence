import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { PlaybackProblemSchema } from '@ValenceContracts/schemas/PlaybackProblem';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';
import { StreamPlayedSchema } from '@ValenceContracts/schemas/StreamOffer';
import type { StreamPlayed } from '@ValenceContracts/schemas/StreamOffer';
import { say } from '@ValenceI18n/say';

type StreamPlayAnswer =
  | StreamPlayed
  | { kind: 'refused'; message: string; problem: PlaybackProblem | null; isGone: boolean };

const RefusedSchema = z.object({
  error: z.string(),
  problem: PlaybackProblemSchema.optional(),
});

const GONE = 410;

/**
 * Asks to play a film from one of the streams offered for it.
 *
 * @param streamId - The offer.
 * @returns The film to play, how far its source has got preparing it, or why it would not play,
 *   with the problem a player shows for it and whether the offer has simply gone.
 */
const playStream = async (streamId: string): Promise<StreamPlayAnswer> => {
  const response = await fetch('/api/streams/play', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ streamId }),
  }).catch(() => null);

  if (response === null) {
    return {
      kind: 'refused',
      message: say('common.theServerCouldNotBeReached'),
      problem: 'unreachable',
      isGone: false,
    };
  }

  const body = await response
    .json()
    .then((value) => JsonValueSchema.parse(value))
    .catch(() => null);

  if (response.ok) {
    const played = StreamPlayedSchema.safeParse(body);

    if (played.success) {
      return played.data;
    }
  }

  const refused = RefusedSchema.safeParse(body);

  return {
    kind: 'refused',
    message: refused.success
      ? refused.data.error
      : say('client.admin.readRefusal.thatCouldNotBeDoneTry'),
    problem: refused.success ? (refused.data.problem ?? null) : null,
    isGone: response.status === GONE,
  };
};

export type { StreamPlayAnswer };

export { playStream };
