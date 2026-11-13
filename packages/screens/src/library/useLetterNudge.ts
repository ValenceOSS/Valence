import { useEffect, useState } from 'react';
import { letterNudge } from '@ValenceScreens/library/letterNudge';
import { measureLetter } from '@ValenceScreens/library/measureLetter';

const NUDGES = new Map<string, { x: number; y: number }>();

/**
 * How far to move a letter so it looks centred in its circle, measured once the font has arrived and
 * remembered for every circle after. Nothing moves until it is known, or where it cannot be measured.
 *
 * @param letter - The letter.
 * @param family - The font, as CSS names it.
 * @param weight - How heavy it is set.
 * @returns The move across and down, each a share of the letter's size.
 */
const useLetterNudge = (
  letter: string,
  family: string,
  weight: number,
): { x: number; y: number } | null => {
  const key = `${letter}|${family}|${weight.toString()}`;
  const [measured, setMeasured] = useState(() => NUDGES.get(key) ?? null);

  useEffect(() => {
    const known = NUDGES.get(key);

    if (known !== undefined) {
      setMeasured(known);

      return;
    }

    let isCurrent = true;
    const measure = () => {
      const shape = measureLetter(letter, family, weight);

      if (shape === null || !isCurrent) {
        return;
      }

      const nudge = letterNudge(shape);

      NUDGES.set(key, nudge);
      setMeasured(nudge);
    };

    if (typeof document === 'undefined' || !('fonts' in document)) {
      measure();
    } else {
      void document.fonts
        .load(`${weight.toString()} 100px ${family}`, letter)
        .then(measure, measure);
    }

    return () => {
      isCurrent = false;
    };
  }, [key, letter, family, weight]);

  return measured;
};

export { useLetterNudge };
