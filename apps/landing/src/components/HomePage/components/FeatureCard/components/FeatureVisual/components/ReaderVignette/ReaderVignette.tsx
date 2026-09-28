import { ProgressBar } from '@ValenceUI/ProgressBar';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';

const PAGES = [
  [
    'The tide had left the road by noon, and the salt lay on it in a crust',
    'that broke under the cart wheels like frost. Ines walked ahead of the',
    'mule, counting the stones that marked each mile.',
  ],
  [
    'By the fourth stone the lighthouse had come up out of the haze, white',
    'and further off than it had any right to be. She stopped, and for the',
    'first time that day let herself wonder who had lit it.',
  ],
] as const;

/**
 * A page of a book open in the reader; pointed at, the page turns and the progress through the book ticks on.
 */
const ReaderVignette = () => (
  <div className="valence-float flex w-full max-w-[calc(var(--vignette-width)*0.8)] flex-col gap-3 rounded-xl px-5 pb-3 pt-4">
    <span className="flex items-baseline justify-between">
      <span className="text-xs uppercase tracking-[0.16em] text-text-muted">Chapter 7</span>
      <span className="text-xs text-text-muted">The Salt Road</span>
    </span>

    <span className="grid">
      {PAGES.map((page, at) => (
        <span
          key={at}
          className={cn(
            'flex flex-col font-serif text-[0.8125rem] leading-relaxed text-text [grid-area:1/1]',
            ACTING,
            at === 0
              ? 'acted:-translate-x-6 acted:opacity-0'
              : 'translate-x-6 opacity-0 delay-150 acted:translate-x-0 acted:opacity-100',
          )}
        >
          {page.join(' ')}
        </span>
      ))}
    </span>

    <Swap
      delay={300}
      className="w-full"
      from={<ProgressBar label="Through the book" value={64} isFull readout="64%" />}
      to={<ProgressBar label="Through the book" value={66} isFull readout="66%" />}
    />
  </div>
);

ReaderVignette.displayName = 'ReaderVignette';

export { ReaderVignette };
