import { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { DECK } from '@ValenceCore/deck/DECK';
import { faceOf } from '@ValenceCore/deck/faceOf';
import { placeCard } from '@ValenceCore/deck/placeCard';
import { DECK_SHARES } from '@ValenceCore/deck/DECK_SHARES';
import { fitTheDeck } from '@ValenceCore/deck/fitTheDeck';
import { frownsAt } from '@ValenceCore/deck/frownsAt';
import { DeckFace } from './components/DeckFace/DeckFace';
import type { DeckMarkProps } from './DeckMark.types';

const INKS = [
  'color-mix(in srgb, var(--color-text) 14%, var(--color-surface))',
  'color-mix(in srgb, var(--color-text) 28%, var(--color-surface))',
  'var(--color-text)',
] as const;

const HOLDS_FANNED_FOR = 1.6;

const HOLDS_STACKED_FOR = 0.35;

/**
 * The Valence mark as a deck of three cards, drawn in the theme's ink: a smiling card in front and
 * two frowning ones behind. Animated, the deck arrives stacked and fans out from under the front
 * card, the frowns coming in as the cards behind it land; for anybody who has asked for less motion
 * it is simply there.
 *
 * @param size - How wide and tall the square it sits in is, in pixels.
 * @param isAnimated - Whether the deck fans out as it arrives.
 * @param loops - Whether it goes on fanning out, gathering back up and fanning out again, for a
 *   mark that plays on its own or while something loads. Once it stops looping it fans out from
 *   wherever it had got to and stays.
 * @param label - What it is, for anybody who cannot see it; omit where a name sits beside it.
 * @param className - Extra classes for the caller's own layout.
 * @returns The mark.
 */
const DeckMark = ({ size, isAnimated = false, loops = false, label, className }: DeckMarkProps) => {
  const reduced = useReducedMotionConfig() ?? false;
  const isMoving = (isAnimated || loops) && !reduced;
  const [progress, setProgress] = useState(isMoving ? 0 : 1);
  const at = useRef(isMoving ? 0 : 1);

  useEffect(() => {
    if (!isMoving) {
      at.current = 1;
      setProgress(1);

      return undefined;
    }

    const going = { isGone: false };
    const isStillHere = () => loops && !going.isGone;
    const follow = (value: number) => {
      at.current = value;
      setProgress(value);
    };
    let controls = animate(at.current, 1, {
      type: 'spring',
      stiffness: 140,
      damping: 15,
      delay: at.current === 0 ? 0.25 : 0,
      onUpdate: follow,
    });

    /**
     * Gathers the cards back under the front one and fans them out again, then does it again.
     */
    const again = async (): Promise<void> => {
      await controls;

      while (isStillHere()) {
        controls = animate(1, 0, {
          type: 'spring',
          stiffness: 120,
          damping: 18,
          delay: HOLDS_FANNED_FOR,
          onUpdate: follow,
        });
        await controls;

        if (!isStillHere()) {
          return;
        }

        controls = animate(0, 1, {
          type: 'spring',
          stiffness: 140,
          damping: 15,
          delay: HOLDS_STACKED_FOR,
          onUpdate: follow,
        });
        await controls;
      }
    };

    void again();

    return () => {
      going.isGone = true;
      controls.stop();
    };
  }, [isMoving, loops]);

  const { scale, shiftX, shiftY } = fitTheDeck(size);
  const frowns = frownsAt(progress);

  return (
    <motion.span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn('relative block shrink-0', className)}
      style={{ width: size, height: size }}
      initial={isMoving ? { scale: 0.7 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <span
        className="absolute left-0 top-0 block"
        style={{
          transformOrigin: '0 0',
          transform: `translate(${shiftX}px, ${shiftY}px) scale(${scale})`,
        }}
      >
        {DECK_SHARES.map((share, index) => {
          const isSmile = share === 0;

          return (
            <span
              key={share}
              className="absolute left-0 top-0 block"
              style={{
                width: DECK.width,
                height: DECK.height,
                borderRadius: DECK.corner,
                background: INKS[index],
                transformOrigin: '0 0',
                transform: `matrix(${placeCard(share * progress).join(',')})`,
              }}
            >
              <DeckFace
                face={faceOf(isSmile)}
                thickness={DECK.thickness}
                opacity={isSmile ? 1 : frowns}
              />
            </span>
          );
        })}
      </span>
    </motion.span>
  );
};

DeckMark.displayName = 'DeckMark';

export { DeckMark };
