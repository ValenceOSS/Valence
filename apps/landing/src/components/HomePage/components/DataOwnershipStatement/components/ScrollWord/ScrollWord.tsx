import { motion, useTransform } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import type { ScrollWordProps } from './ScrollWord.types';

const DIM_OPACITY = 0.25;

const REGULAR_WEIGHT = 400;

const BOLD_WEIGHT = 700;

const LOGO_SIZE_PX = 26;

const LOGO_WRAPPER_WIDTH_PX = 36;

const LOGO_GAP_PX = 6;

const HASH_WIDTH_EM = 0.6;

const CORE_WORD = /^(?<core>[\w'’-]+)(?<punctuation>[.,;:—]*)$/u;

/**
 * Splits a word from any punctuation stuck to its end, so an annotation can wrap the word alone
 * rather than the full stop or comma riding along inside it.
 *
 * @param word - The word, punctuation and all.
 * @returns The word by itself, and whatever punctuation trailed it.
 */
const splitTrailingPunctuation = (word: string): { core: string; punctuation: string } => {
  const match = CORE_WORD.exec(word);

  return { core: match?.groups?.core ?? word, punctuation: match?.groups?.punctuation ?? '' };
};

/**
 * Builds a transform that fades a token colour in over transparent as its input goes from nothing
 * to everything, for a background or decoration that should materialise rather than switch on.
 *
 * @param token - The CSS colour token to fade in, such as `var(--color-pink)`.
 * @param atFull - How much of the token should show once fully revealed, from 0 to 1.
 * @returns A function `useTransform` can call with the reveal value.
 */
const fadeInOver =
  (token: string, atFull: number) =>
  (value: number): string =>
    `color-mix(in oklab, ${token} ${(value * atFull * 100).toString()}%, transparent)`;

/**
 * Grows a length from nothing to a fixed size as its input goes from nothing to everything, for
 * space — a hidden character, the mark before a word — that should open up rather than sit
 * reserved from the start.
 *
 * @param sizePx - The size to grow to, in pixels.
 * @returns A function `useTransform` can call with the reveal value.
 */
const growPx =
  (sizePx: number) =>
  (value: number): string =>
    `${(value * sizePx).toString()}px`;

/**
 * One word of a statement that fills in as the page is scrolled past it, dim until its place in the
 * line has been reached — and, for a few words worth dwelling on, dressed as a tag or an underlined
 * emphasis. That dressing is drawn from the very first render — so switching it on outright can't
 * cause a pop — but every part of it that would otherwise announce itself early (the `#`, the bold
 * weight, the room the mark needs) is held at zero and only grows in as scroll reaches the word,
 * alongside its colour.
 *
 * @param children - The word itself.
 * @param index - Where it sits in the statement, counting from zero.
 * @param total - How many words the statement holds, so its share of the scroll can be worked out.
 * @param progress - How far through the pinned section the page has scrolled, from nothing to all
 *   of it.
 * @param annotation - How this particular word should stand out from the rest, once its place in
 *   the scroll has actually been reached.
 */
const ScrollWord = ({ children, index, total, progress, annotation }: ScrollWordProps) => {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [DIM_OPACITY, 1]);
  const reveal = useTransform(progress, [start, end], [0, 1], { clamp: true });

  const fontWeight = useTransform(reveal, [0, 1], [REGULAR_WEIGHT, BOLD_WEIGHT]);
  const tagBackground = useTransform(reveal, fadeInOver('var(--color-pink)', 0.15));
  const hashWidth = useTransform(reveal, (value) => `${(value * HASH_WIDTH_EM).toString()}em`);
  const emphasisBackground = useTransform(reveal, fadeInOver('var(--color-accent)', 0.15));
  const emphasisDecoration = useTransform(reveal, fadeInOver('var(--color-accent)', 1));
  const logoWidth = useTransform(reveal, growPx(LOGO_WRAPPER_WIDTH_PX));
  const logoMarginRight = useTransform(reveal, growPx(LOGO_GAP_PX));

  if (annotation === 'tag') {
    return (
      <motion.span style={{ opacity }} className="text-text">
        <motion.span
          style={{ backgroundColor: tagBackground, fontWeight }}
          className="mx-0.5 rounded-md px-2 py-0.5 font-mono text-[0.85em]"
        >
          <motion.span
            style={{ width: hashWidth, opacity: reveal }}
            className="inline-block overflow-hidden align-bottom"
          >
            #
          </motion.span>
          {children}
        </motion.span>{' '}
      </motion.span>
    );
  }

  if (annotation === 'emphasis') {
    const { core, punctuation } = splitTrailingPunctuation(children);

    return (
      <motion.span style={{ opacity }} className="text-text">
        <motion.span
          style={{
            backgroundColor: emphasisBackground,
            textDecorationColor: emphasisDecoration,
            fontWeight,
          }}
          className="mx-0.5 rounded-md px-1.5 underline decoration-2 underline-offset-4"
        >
          <motion.span
            style={{ width: logoWidth, marginRight: logoMarginRight, opacity: reveal }}
            className="inline-flex align-middle overflow-hidden"
          >
            <Logo size={LOGO_SIZE_PX} />
          </motion.span>
          {core}
        </motion.span>
        {punctuation}{' '}
      </motion.span>
    );
  }

  return (
    <motion.span style={{ opacity }} className="text-text">
      {children}{' '}
    </motion.span>
  );
};

ScrollWord.displayName = 'ScrollWord';

export { ScrollWord };
