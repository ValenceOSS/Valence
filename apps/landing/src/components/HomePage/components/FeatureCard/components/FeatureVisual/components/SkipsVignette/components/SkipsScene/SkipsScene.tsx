import { Pause as PauseIcon, SkipForward as SkipForwardIcon } from '@keyline-icons/react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const OFFERED_AT = 18;

const REACHES_AT = 78;

const PRESSED_AT = 86;

const JUMPS_AT = 94;

const TAKES_HOLD_AT = 172;

const LETS_GO_AT = 206;

const BEFORE_THE_INTRO = 7;

const PAST_THE_INTRO = 12;

const STARTS_AT_SECONDS = 192;

const LANDS_AT_SECONDS = 280;

const BAR_FROM = 6.5;

const BAR_ACROSS = 0.665;

const BAR_DOWN = 84;

/**
 * Writes a time into an episode as minutes and seconds.
 *
 * @param seconds - How far in.
 * @returns The time, as a player shows it.
 */
const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60).toString()}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;

/**
 * An episode playing into its intro, the skip offered, a pointer pressing it and the playhead jumping
 * past the part already known — then the pointer taking the playhead back to before the intro, which
 * is where it began, so it goes round without a seam.
 */
const SkipsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const offered = spring({
    frame: frame - OFFERED_AT,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const gone = interpolate(frame, [PRESSED_AT + 4, PRESSED_AT + 14], [0, 1], clamp);
  const isOffered = frame < TAKES_HOLD_AT;
  const pressed = frame >= PRESSED_AT && frame < PRESSED_AT + 6 ? 0.94 : 1;
  const jumped = spring({ frame: frame - JUMPS_AT, fps, config: { damping: 18, stiffness: 120 } });
  const draggedBack = interpolate(frame, [TAKES_HOLD_AT, LETS_GO_AT], [0, 1], {
    ...clamp,
    easing: Easing.inOut((at) => Easing.cubic(at)),
  });
  const progress =
    frame < JUMPS_AT
      ? interpolate(frame, [0, JUMPS_AT], [BEFORE_THE_INTRO, BEFORE_THE_INTRO + 0.4])
      : frame < TAKES_HOLD_AT
        ? interpolate(jumped, [0, 1], [BEFORE_THE_INTRO + 0.4, PAST_THE_INTRO])
        : frame < LETS_GO_AT
          ? interpolate(draggedBack, [0, 1], [PAST_THE_INTRO, BEFORE_THE_INTRO - 0.3])
          : interpolate(frame, [LETS_GO_AT, 240], [BEFORE_THE_INTRO - 0.3, BEFORE_THE_INTRO]);
  const seconds =
    frame >= JUMPS_AT && frame < TAKES_HOLD_AT
      ? LANDS_AT_SECONDS + (frame - JUMPS_AT) / fps
      : interpolate(
          progress,
          [BEFORE_THE_INTRO, PAST_THE_INTRO],
          [STARTS_AT_SECONDS, LANDS_AT_SECONDS],
        );
  const playheadX = BAR_FROM + BAR_ACROSS * progress;

  return (
    <AbsoluteFill className="flex flex-col justify-end overflow-hidden rounded-xl bg-linear-to-br from-accent/30 via-shade/80 to-shade p-2.5">
      <span
        className="absolute bottom-20 right-3"
        style={{
          opacity: isOffered ? offered * (1 - gone) : 0,
          transform: `translateY(${((1 - offered) * 10 + gone * 8).toString()}px) scale(${pressed.toString()})`,
        }}
      >
        <Button size="md" variant="secondary" className="px-4" onClick={nothing}>
          Skip Intro
          <Icon of={SkipForwardIcon} size={16} />
        </Button>
      </span>

      <div className="valence-solid flex flex-col gap-1.5 rounded-lg px-3 py-2 text-text">
        <span className="flex items-center gap-3">
          <span className="relative h-1 min-w-0 flex-1 rounded-full bg-[var(--surface-hover)]">
            <span className="absolute inset-y-0 left-[3%] w-[6%] rounded-full bg-text/25" />
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${progress.toString()}%` }}
            />
            <span
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{
                left: `${progress.toString()}%`,
                opacity: draggedBack > 0 && frame < LETS_GO_AT ? 1 : 0,
              }}
            />
          </span>
          <span className="shrink-0 text-xs tabular-nums">
            {clock(seconds)}
            <span className="text-text-muted"> / 41:08</span>
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs text-text-muted">
          <Icon of={PauseIcon} size={14} tone="strong" />
          <span className="truncate">The Lantern Keepers · S2 E4 · Low Tide</span>
        </span>
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 46, y: 82 },
          { at: 40, x: 46, y: 82 },
          { at: REACHES_AT, x: 82, y: 62 },
          { at: PRESSED_AT, x: 82, y: 62, isPressing: true },
          { at: 130, x: 82, y: 62 },
          { at: TAKES_HOLD_AT - 4, x: BAR_FROM + BAR_ACROSS * PAST_THE_INTRO, y: BAR_DOWN },
          {
            at: TAKES_HOLD_AT,
            x: BAR_FROM + BAR_ACROSS * PAST_THE_INTRO,
            y: BAR_DOWN,
            isPressing: true,
            holdsUntil: LETS_GO_AT,
          },
          { at: LETS_GO_AT, x: playheadX, y: BAR_DOWN },
          { at: 239, x: 46, y: 82 },
        ]}
      />
    </AbsoluteFill>
  );
};

SkipsScene.displayName = 'SkipsScene';

export { SkipsScene };
