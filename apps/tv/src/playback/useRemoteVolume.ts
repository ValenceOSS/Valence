import { useCallback, useEffect, useState } from 'react';
import { turnTheVideoTo } from '@ValenceTv/playback/turnTheVideoTo';

const SHOWN_FOR_MS = 2_500;

const FORGETS_AFTER_MS = 1_500;

let heardAt = 1;

let forgetting: ReturnType<typeof setTimeout> | null = null;

type RemoteVolume = {
  level: number;
  isShown: boolean;
  turnTo: (level: number) => void;
};

/**
 * How loud the film plays here, as another device turns it up or down: the player is set to it, it
 * is shown for a moment each time it changes, and it carries on to the next episode rather than
 * starting loud again — though not to a film started once this one has properly stopped, which
 * plays all the way up, since the television's own remote turns the television, not the app.
 *
 * @param player - The player to set it on.
 * @returns How loud it is, whether to show it now, and how to turn it up or down.
 */
const useRemoteVolume = (player: { volume: number }): RemoteVolume => {
  const [level, setLevel] = useState(heardAt);
  const [turned, setTurned] = useState(0);

  useEffect(() => {
    if (forgetting !== null) {
      clearTimeout(forgetting);
      forgetting = null;
    }

    return () => {
      forgetting = setTimeout(() => {
        forgetting = null;
        heardAt = 1;
      }, FORGETS_AFTER_MS);
    };
  }, []);

  useEffect(() => {
    turnTheVideoTo(player, level);
  }, [player, level]);

  useEffect(() => {
    if (turned === 0) {
      return undefined;
    }

    const hides = setTimeout(() => {
      setTurned(0);
    }, SHOWN_FOR_MS);

    return () => {
      clearTimeout(hides);
    };
  }, [turned]);

  const turnTo = useCallback((to: number) => {
    const kept = Math.min(Math.max(to, 0), 1);

    heardAt = kept;
    setLevel(kept);
    setTurned((was) => was + 1);
  }, []);

  return { level, isShown: turned !== 0, turnTo };
};

export type { RemoteVolume };

export { useRemoteVolume };
