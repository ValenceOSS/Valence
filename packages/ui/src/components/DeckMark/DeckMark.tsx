import { useEffect, useState } from 'react';
import { animate, motion, useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { DECK } from './DECK';
import { faceOf } from './faceOf';
import { placeCard } from './placeCard';
import { DeckFace } from './components/DeckFace/DeckFace';
import type { DeckMarkProps } from './DeckMark.types';

const SHARES = [1, 0.5, 0] as const;

const INKS = [
  'color-mix(in srgb, var(--color-text) 45%, var(--color-surface))',
  'color-mix(in srgb, var(--color-text) 72%, var(--color-surface))',
  'var(--color-text)',
] as const;

const CORNERS = SHARES.map((share) => placeCard(share)).flatMap((card) =>
  [
    [0, 0],
    [DECK.width, 0],
    [0, DECK.height],
    [DECK.width, DECK.height],
  ].map(([x = 0, y = 0]) => [
    card[0] * x + card[2] * y + card[4],
    card[1] * x + card[3] * y + card[5],
  ]),
);

const LEFT = Math.min(...CORNERS.map(([x = 0]) => x));

const TOP = Math.min(...CORNERS.map(([, y = 0]) => y));

const SPAN = Math.max(
  Math.max(...CORNERS.map(([x = 0]) => x)) - LEFT,
  Math.max(...CORNERS.map(([, y = 0]) => y)) - TOP,
);

const SPREAD = Math.max(...CORNERS.map(([x = 0]) => x)) - LEFT;

const RISE = Math.max(...CORNERS.map(([, y = 0]) => y)) - TOP;

/**
 * The Valence mark as a deck of three cards, drawn in the theme's ink: a smiling card in front and
 * two frowning ones behind. Animated, the deck arrives stacked and fans out from under the front
 * card, the frowns coming in as the cards behind it land; for anybody who has asked for less motion
 * it is simply there.
 *
 * @param size - How wide and tall the square it sits in is, in pixels.
 * @param isAnimated - Whether the deck fans out as it arrives.
 * @param label - What it is, for anybody who cannot see it; omit where a name sits beside it.
 * @param className - Extra classes for the caller's own layout.
 * @returns The mark.
 */
const DeckMark = ({ size, isAnimated = false, label, className }: DeckMarkProps) => {
  const reduced = useReducedMotionConfig() ?? false;
  const isMoving = isAnimated && !reduced;
  const [progress, setProgress] = useState(isMoving ? 0 : 1);

  useEffect(() => {
    if (!isMoving) {
      setProgress(1);

      return undefined;
    }

    const controls = animate(0, 1, {
      type: 'spring',
      stiffness: 140,
      damping: 15,
      delay: 0.25,
      onUpdate: setProgress,
    });

    return () => controls.stop();
  }, [isMoving]);

  const scale = size / SPAN;
  const shiftX = (size - SPREAD * scale) / 2 - LEFT * scale;
  const shiftY = (size - RISE * scale) / 2 - TOP * scale;
  const frowns = Math.min(1, Math.max(0, (progress - 0.5) / 0.4));

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
        {SHARES.map((share, index) => {
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
