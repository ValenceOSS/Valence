import { useId } from 'react';
import { cn } from '@ValenceUI/cn';
import type { StatusMarkProps, StatusMarkState } from './StatusMark.types';

const MORPH =
  'transition-[stroke-dasharray,stroke-dashoffset,transform,opacity,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const TONES: Record<StatusMarkState, string> = {
  loading: 'text-text-muted',
  idle: 'text-text-muted',
  progress: 'text-highlight',
  done: 'text-accent',
  cancelled: 'text-text-muted',
  failed: 'text-danger',
};

/**
 * The colour progress is drawn in: gold while it has barely begun, orange around halfway, and
 * green once it is nearly there, so how far along something is reads before the shape does.
 *
 * @param progress - How far along, from nothing to the whole.
 * @returns The colour class.
 */
const toneOfProgress = (progress: number): string =>
  progress < 0.375 ? 'text-highlight' : progress < 0.625 ? 'text-busy' : 'text-success';

/**
 * Valence's one mark for how something stands, a rounded square that turns from one state into
 * the next rather than being swapped: dashes marching round it while it waits, joining into an
 * outline once it is ready, filling clockwise as it makes progress, then drawing a tick when it is
 * done, folding the tick into a cross when it is cancelled, and stretching the cross into a slash
 * when it fails. Every change is a morph of the same few strokes, so moving between any two states
 * is one fluid movement.
 *
 * @param state - How it stands.
 * @param progress - How far along, from nothing to the whole, while it is making progress.
 * @param size - How wide it is drawn, in pixels.
 * @param label - What it stands for, read out where nothing beside it says so.
 * @param className - Extra classes for the caller's own layout.
 */
const StatusMark = ({ state, progress = 0, size = 16, label, className }: StatusMarkProps) => {
  const inside = `valence-mark-${useId().replace(/:/gu, '')}`;
  const filled = state === 'progress' ? Math.min(Math.max(progress, 0), 1) : 0;
  const isDashed = state === 'loading';
  const isTicked = state === 'done';
  const isCrossed = state === 'cancelled' || state === 'failed';
  const isSlashed = state === 'failed';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn(
        'shrink-0 overflow-visible',
        MORPH,
        state === 'progress' ? toneOfProgress(filled) : TONES[state],
        className,
      )}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        pathLength={100}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={isDashed ? '7.5 5' : '100 0'}
        className={cn(MORPH, isDashed && 'animate-[valence-mark-march_1.4s_linear_infinite]')}
      />

      <clipPath id={inside}>
        <rect x="7" y="7" width="10" height="10" rx="2.5" />
      </clipPath>

      <circle
        cx="12"
        cy="12"
        r="3.6"
        pathLength={100}
        stroke="currentColor"
        strokeWidth={7.2}
        strokeDasharray={`${(filled * 100).toString()} 100`}
        transform="rotate(-90 12 12)"
        clipPath={`url(#${inside})`}
        className={cn(MORPH, filled === 0 && 'opacity-0')}
      />

      <path
        d="M8.25 12.4l2.6 2.6 4.9-5.4"
        pathLength={100}
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100 100"
        strokeDashoffset={isTicked ? 0 : 100}
        className={cn(MORPH, 'origin-center', isTicked ? 'scale-100' : 'scale-50 opacity-0')}
      />

      <path
        d="M9.25 9.25l5.5 5.5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        className={cn(
          MORPH,
          'origin-center',
          isCrossed && !isSlashed ? 'scale-100' : 'scale-50 opacity-0',
        )}
      />

      <path
        d="M14.75 9.25l-5.5 5.5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        className={cn(
          MORPH,
          'origin-center',
          isCrossed && !isSlashed ? 'scale-100' : 'scale-50 opacity-0',
        )}
      />

      <path
        d="M17.6 6.4L6.4 17.6"
        pathLength={100}
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray={isSlashed ? '100 100' : '0 100'}
        strokeDashoffset={isSlashed ? 0 : -50}
        className={cn(MORPH, !isSlashed && 'opacity-0')}
      />
    </svg>
  );
};

StatusMark.displayName = 'StatusMark';

export { StatusMark };
