import { useEffect, useRef, useState } from 'react';
import { AVolumeRow } from '@ValenceMobile/components/AVolumeRow/AVolumeRow';
import { TheSystemVolume } from '@ValenceMobile/components/TheSystemVolume/TheSystemVolume';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { useVolumeButtons } from '@ValenceMobile/hooks/useVolumeButtons';
import type { TheTelevisionsVolumeProps } from './TheTelevisionsVolume.types';

const HELD_FOR_MS = 2_000;

const { colours } = PLAYER_LOOK;

/**
 * The television's volume on its remote, in the player's look: a slider that turns it up or down,
 * and the buttons on the side of the phone doing the same while the remote is open, a press moving
 * it as far as it would move the phone. What it was turned to is shown straight away, and held a
 * moment over what the television last said, so a report sent before the turn does not pull it
 * back.
 *
 * @param level - How loud the television last said it is.
 * @param onTurn - Told to turn the television to how loud.
 */
const TheTelevisionsVolume = ({ level, onTurn }: TheTelevisionsVolumeProps) => {
  const [held, setHeld] = useState<number | null>(null);
  const [turns, setTurns] = useState(0);
  const shown = held ?? level;
  const aimed = useRef(shown);

  useEffect(() => {
    aimed.current = shown;
  }, [shown]);

  useEffect(() => {
    if (turns === 0) {
      return undefined;
    }

    const lets = setTimeout(() => {
      setHeld(null);
    }, HELD_FOR_MS);

    return () => {
      clearTimeout(lets);
    };
  }, [turns]);

  /**
   * Shows the volume turned to, and holds it there a moment.
   *
   * @param to - How loud.
   */
  const hold = (to: number): number => {
    const kept = Math.min(Math.max(to, 0), 1);

    aimed.current = kept;
    setHeld(kept);
    setTurns((was) => was + 1);

    return kept;
  };

  /**
   * Turns the television to a volume.
   *
   * @param to - How loud.
   */
  const turnTo = (to: number) => {
    onTurn(hold(to));
  };

  useVolumeButtons(true, (by) => {
    turnTo(aimed.current + by);
  });

  return (
    <>
      <TheSystemVolume />
      <AVolumeRow
        level={shown}
        colour={colours.text}
        quietColour={colours.quiet}
        restColour={colours.rest}
        onTurning={hold}
        onTurned={turnTo}
      />
    </>
  );
};

TheTelevisionsVolume.displayName = 'TheTelevisionsVolume';

export { TheTelevisionsVolume };
