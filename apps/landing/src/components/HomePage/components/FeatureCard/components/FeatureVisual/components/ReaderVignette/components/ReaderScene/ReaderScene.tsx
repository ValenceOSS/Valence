import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Maximize as MaximizeIcon,
  PanelRight as PanelRightIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Icon } from '@ValenceUI/Icon';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const SPREADS = [
  [
    [
      '“And a happy new year!”',
      '“Good afternoon!” said Scrooge.',
      'His nephew left the room without an angry word, notwithstanding. He stopped at the outer door to bestow the greetings of the season on the clerk.',
    ],
    [
      '“Are there no prisons?” asked Scrooge.',
      '“Plenty of prisons,” said the gentleman, laying down the pen again.',
      '“And the Union workhouses?” demanded Scrooge. “Are they still in operation?”',
    ],
  ],
  [
    [
      '“Nothing!” Scrooge replied.',
      '“You wish to be anonymous?”',
      '“I wish to be left alone,” said Scrooge. “Since you ask me what I wish, gentlemen, that is my answer.”',
    ],
    [
      '“Many can’t go there; and many would rather die.”',
      'Seeing clearly that it would be useless to pursue their point, the gentlemen withdrew.',
    ],
  ],
  [
    [
      'Meanwhile the fog and darkness thickened so, that people ran about with flaring links, proffering their services to go before horses in carriages.',
    ],
    [
      'The ancient tower of a church, whose gruff old bell was always peeping slyly down at Scrooge, became invisible, and struck the hours in the clouds.',
    ],
  ],
] as const;

const TURNS = [
  { at: 60, by: 1 },
  { at: 120, by: 1 },
  { at: 188, by: -1 },
  { at: 210, by: -1 },
] as const;

const READ_TO = [8, 9, 11] as const;

/**
 * The reader as it is on a wide screen — the book and its chapter along the top, two columns of the
 * book side by side, the arrows at its edges and how far through along the bottom — and a pointer
 * pressing the arrow on the right to turn the spread, which slides aside and gives way to the next
 * exactly as the reader's own turn does.
 */
const ReaderScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leaves = Math.max(Math.round((PAGE_TURN.leaves.ms / 1000) * fps), 1);
  const arrives = Math.max(Math.round((PAGE_TURN.arrives.ms / 1000) * fps), 1);
  const turned = TURNS.filter((turn) => frame >= turn.at + leaves).reduce(
    (spread, turn) => spread + turn.by,
    0,
  );
  const turning = TURNS.find((turn) => frame >= turn.at && frame < turn.at + leaves + arrives);
  const sliding =
    turning === undefined
      ? 0
      : frame < turning.at + leaves
        ? interpolate(frame, [turning.at, turning.at + leaves], [0, -turning.by], {
            easing: Easing.in(Easing.quad),
          })
        : interpolate(
            frame,
            [turning.at + leaves, turning.at + leaves + arrives],
            [turning.by, 0],
            {
              easing: Easing.out(Easing.cubic),
            },
          );
  const [left, right] = SPREADS[turned] ?? SPREADS[0];
  const readTo = READ_TO[turned] ?? READ_TO[0];

  return (
    <AbsoluteFill className="overflow-hidden rounded-xl bg-[var(--color-surface)] font-body text-text">
      <header className="flex h-8 shrink-0 items-center gap-2 px-3 text-[0.625rem] font-medium text-text">
        <Icon of={XIcon} size={12} />
        <span className="truncate">A Christmas Carol — Stave I: Marley’s Ghost</span>
        <span className="ml-auto flex items-center gap-2.5">
          <Icon of={MaximizeIcon} size={12} />
          <Icon of={PanelRightIcon} size={12} />
        </span>
      </header>

      <div className="relative flex min-h-0 flex-1 items-start">
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-text">
          <Icon of={ChevronLeftIcon} size={12} />
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text">
          <Icon of={ChevronRightIcon} size={12} />
        </span>

        <div
          className="grid w-full grid-cols-2 gap-6 px-9 pt-1 text-[0.625rem] leading-[1.55] text-text"
          style={{
            transform: `translateX(${(sliding * 100 * PAGE_TURN.slidesBy).toString()}%)`,
            opacity: 1 - Math.min(Math.abs(sliding), 1),
          }}
        >
          {[left, right].map((column, at) => (
            <div key={at.toString()} className="flex flex-col gap-1.5">
              {column.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="flex h-6 shrink-0 items-center gap-3 px-2">
        <span className="relative h-1 flex-1 rounded-full bg-text/20">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-text"
            style={{ width: `${readTo.toString()}%` }}
          />
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text"
            style={{ left: `${readTo.toString()}%` }}
          />
        </span>
        <span className="text-[0.55rem] tabular-nums text-text">{readTo.toString()}%</span>
      </footer>

      <SceneCursor
        path={[
          { at: 0, x: 52, y: 62 },
          { at: 24, x: 52, y: 62 },
          { at: 54, x: 95, y: 50 },
          { at: TURNS[0].at, x: 95, y: 50, isPressing: true },
          { at: TURNS[1].at, x: 95, y: 50, isPressing: true },
          { at: 178, x: 4.5, y: 50 },
          { at: TURNS[2].at, x: 4.5, y: 50, isPressing: true },
          { at: TURNS[3].at, x: 4.5, y: 50, isPressing: true },
          { at: 239, x: 52, y: 62 },
        ]}
      />
    </AbsoluteFill>
  );
};

ReaderScene.displayName = 'ReaderScene';

export { ReaderScene };
