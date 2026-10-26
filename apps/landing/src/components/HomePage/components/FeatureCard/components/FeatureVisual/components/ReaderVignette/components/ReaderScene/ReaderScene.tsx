import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Slider } from '@ValenceUI/Slider';
import { PAGE_TURN } from '@ValenceCore/tokens/PAGE_TURN';
import { ReaderChrome } from '@ValenceScreens/components/ReaderChrome/ReaderChrome';
import { say } from '@ValenceI18n/say';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

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
  { at: 132, by: 1 },
] as const;

const FADES_BACK = [204, 218, 236] as const;

const READ_TO = [8, 9, 11] as const;

/**
 * The app's own reader on a wide screen — the book and its chapter along the top, two columns of the
 * book side by side, the arrows at its edges and how far through along the bottom — and a pointer
 * pressing the arrow on the right to turn the spread, which slides aside and gives way to the next
 * exactly as the reader's own turn does.
 */
const ReaderScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leaves = Math.max(Math.round((PAGE_TURN.leaves.ms / 1000) * fps), 1);
  const arrives = Math.max(Math.round((PAGE_TURN.arrives.ms / 1000) * fps), 1);
  const turned =
    frame >= FADES_BACK[1]
      ? 0
      : TURNS.filter((turn) => frame >= turn.at + leaves).reduce(
          (spread, turn) => spread + turn.by,
          0,
        );
  const shown = interpolate(frame, [...FADES_BACK], [1, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const turning = TURNS.find((turn) => frame >= turn.at && frame < turn.at + leaves + arrives);
  const sliding =
    turning === undefined
      ? 0
      : frame < turning.at + leaves
        ? interpolate(frame, [turning.at, turning.at + leaves], [0, -turning.by], {
            easing: Easing.in((at) => Easing.quad(at)),
          })
        : interpolate(
            frame,
            [turning.at + leaves, turning.at + leaves + arrives],
            [turning.by, 0],
            {
              easing: Easing.out((at) => Easing.cubic(at)),
            },
          );
  const [left, right] = SPREADS[turned] ?? SPREADS[0];
  const readTo = READ_TO[turned] ?? READ_TO[0];

  return (
    <AbsoluteFill className="font-body text-text">
      <div className="absolute right-6 top-6 flex h-[19rem] w-[37.5rem] overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-lifted)]">
        <ReaderChrome
          title="A Christmas Carol — Stave I: Marley’s Ghost"
          isShown
          isRightToLeft={false}
          panel={null}
          isPanelOpen={false}
          isPanelPinned={false}
          onPanelOpenChange={nothing}
          onForward={nothing}
          onBack={nothing}
          onClose={nothing}
          footer={
            <>
              <Slider
                label={say('screens.bookDialog.howFarThrough')}
                tone="overlay"
                value={readTo}
                max={100}
                onValueChange={nothing}
                className="flex-1"
              />

              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-on-scrim/80">
                {`${readTo.toString()}%`}
              </span>
            </>
          }
        >
          <div className="flex h-full w-full flex-col px-12 py-14">
            <div
              className="grid w-full grid-cols-2 gap-10 text-lg leading-[1.55] text-text"
              style={{
                transform: `translateX(${(sliding * 100 * PAGE_TURN.slidesBy).toString()}%)`,
                opacity: (1 - Math.min(Math.abs(sliding), 1)) * shown,
              }}
            >
              {[left, right].map((column, at) => (
                <div key={at.toString()} className="flex flex-col gap-3">
                  {column.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ReaderChrome>
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 74, y: 70 },
          { at: 24, x: 74, y: 70 },
          { at: 54, x: 91, y: 55 },
          { at: TURNS[0].at, x: 91, y: 55, isPressing: true },
          { at: TURNS[1].at, x: 91, y: 55, isPressing: true },
          { at: 239, x: 74, y: 70 },
        ]}
      />
    </AbsoluteFill>
  );
};

ReaderScene.displayName = 'ReaderScene';

export { ReaderScene };
