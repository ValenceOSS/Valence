import { useRef } from 'react';
import { useReducedMotionConfig, useScroll, useSpring } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { ScrollWord } from './components/ScrollWord/ScrollWord';
import type { ScrollWordAnnotation } from './components/ScrollWord/ScrollWord.types';

type Word = { text: string; annotation?: ScrollWordAnnotation; startsLine?: true };

const WORDS: Word[] = [
  { text: 'Your' },
  { text: 'library', annotation: 'tag' },
  { text: 'is' },
  { text: 'yours.' },
  { text: 'Your', startsLine: true },
  { text: 'history' },
  { text: 'is' },
  { text: 'yours.' },
  { text: 'Nothing', startsLine: true },
  { text: 'about' },
  { text: 'how' },
  { text: 'you' },
  { text: 'watch' },
  { text: 'should' },
  { text: 'leave', startsLine: true },
  { text: 'the' },
  { text: 'server' },
  { text: 'you' },
  { text: 'run,' },
  { text: 'so' },
  { text: 'with', startsLine: true },
  { text: 'Valence,', annotation: 'emphasis' },
  { text: 'it' },
  { text: 'never' },
  { text: 'does.' },
];

type Line = { startIndex: number; words: Word[] };

const LINES: Line[] = WORDS.reduce<Line[]>((lines, word, index) => {
  const current = lines[lines.length - 1];

  if (current === undefined || word.startsLine === true) {
    lines.push({ startIndex: index, words: [word] });
  } else {
    current.words.push(word);
  }

  return lines;
}, []);

const STATEMENT = WORDS.map((word) => word.text).join(' ');

const STATEMENT_CLASSES =
  'mx-auto max-w-5xl px-5 text-center text-3xl font-semibold leading-snug tracking-tight text-text sm:px-10 sm:text-4xl lg:text-5xl';

/**
 * A statement about what happens to a household's data, drawn word by word as the page scrolls past
 * it rather than arriving all at once: the point being made is that this takes attention, not that
 * it takes a second. A few words are dressed apart from the rest, so the statement reads as
 * something considered rather than a plain sentence dimmed and lit.
 *
 * Each line is fixed rather than left to reflow: a word growing to make room for a `#` or the mark
 * changes that line's own width, and a line still free to wrap would occasionally shove a word onto
 * the next one mid-animation. Held to one line each, from the width the layout was designed for
 * upward, that can't happen — only the phone-width fallback still wraps, where the animation moves
 * less text around to begin with.
 */
const DataOwnershipStatement = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.001,
  });

  if (prefersReducedMotion === true) {
    return (
      <section aria-label="On your data" className="py-24">
        <p className={STATEMENT_CLASSES}>{STATEMENT}</p>
      </section>
    );
  }

  return (
    <section aria-label="On your data" ref={containerRef} className="relative min-h-[200vh]">
      <p className={cn('sticky top-0 flex h-svh items-center justify-center', STATEMENT_CLASSES)}>
        <span>
          {LINES.map((line) => (
            <span key={line.startIndex} className="block lg:whitespace-nowrap">
              {line.words.map((word, offset) => {
                const index = line.startIndex + offset;

                return (
                  <ScrollWord
                    key={`${word.text}-${index.toString()}`}
                    index={index}
                    total={WORDS.length}
                    progress={smoothProgress}
                    {...(word.annotation === undefined ? {} : { annotation: word.annotation })}
                  >
                    {word.text}
                  </ScrollWord>
                );
              })}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
};

DataOwnershipStatement.displayName = 'DataOwnershipStatement';

export { DataOwnershipStatement };
