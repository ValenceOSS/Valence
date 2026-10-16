import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPreRoll } from '@ValenceClient/playback/fetchPreRoll';

type PreRollStep =
  | { kind: 'asking' }
  | { kind: 'none' }
  | { kind: 'clip'; address: string; onDone: () => void };

/**
 * Whether a pre-roll clip plays before a title, and which: asked of the server once the title is
 * known to start from the beginning, outside a watch party, and played once — skipped or ended,
 * it is not asked for again until another title is opened.
 *
 * @param mediaId - The title about to play, where one is.
 * @param isWanted - Whether one may play at all: from the beginning, outside a watch party, and
 *   only before the title the player was opened on, not every episode after it.
 * @returns What to do before the title: wait for the answer, play a clip, or nothing.
 */
const usePreRoll = (mediaId: string | null, isWanted: boolean): PreRollStep => {
  const [playedFor, setPlayedFor] = useState<string | null>(null);
  const isAsking = isWanted && mediaId !== null && playedFor !== mediaId;
  const asked = useQuery({
    queryKey: ['preRoll', mediaId],
    queryFn: () => (mediaId === null ? null : fetchPreRoll(mediaId)),
    enabled: isAsking,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const onDone = useCallback(() => {
    setPlayedFor(mediaId);
  }, [mediaId]);

  if (!isAsking) {
    return { kind: 'none' };
  }

  if (asked.isPending) {
    return { kind: 'asking' };
  }

  const clip = asked.data ?? null;

  return clip === null ? { kind: 'none' } : { kind: 'clip', address: clip.address, onDone };
};

export type { PreRollStep };

export { usePreRoll };
