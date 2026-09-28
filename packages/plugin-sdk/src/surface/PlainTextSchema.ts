import { z } from 'zod';

const HIDDEN = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x7f],
  [0x20_2a, 0x20_2e],
  [0x20_66, 0x20_69],
] as const;

/**
 * Text a plugin shows, which is only ever text: no markup is read from it anywhere, and the control
 * and bidirectional-override characters that could disguise it are refused.
 *
 * @param most - The longest it may be.
 * @returns The schema.
 */
const PlainTextSchema = (most: number) =>
  z
    .string()
    .max(most)
    .refine(
      (text) =>
        ![...text].some((character) => {
          const point = character.codePointAt(0) ?? 0;

          return HIDDEN.some(([from, to]) => point >= from && point <= to);
        }),
      'Plugin text holds no control characters',
    );

export { PlainTextSchema };
