import { Pause as PauseIcon } from '@keyline-icons/react';
import { SkipForward as SkipForwardFilledIcon } from '@keyline-icons/react/fill';
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
import { describeSkip } from '@ValenceClient/playback/fetchSegments';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const OFFERED_AT = 18;

const REACHES_AT = 78;

const PRESSED_AT = 86;

const JUMPS_AT = 94;

const RETURNS_FROM = 184;

const RETURNS_BY = 224;

const BEFORE_THE_INTRO = 7;

const PAST_THE_INTRO = 12;

const STARTS_AT_SECONDS = 192;

const LANDS_AT_SECONDS = 280;

const THE_INTRO: MediaSegment = {
  kind: 'intro',
  startSeconds: 190,
  endSeconds: 280,
  source: 'fingerprint',
};

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
 * past the part already known — then the episode easing back to before the intro, which
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
  const pressed = frame >= PRESSED_AT && frame < PRESSED_AT + 6 ? 0.94 : 1;
  const jumped = spring({ frame: frame - JUMPS_AT, fps, config: { damping: 18, stiffness: 120 } });
  const goesBack = interpolate(frame, [RETURNS_FROM, RETURNS_BY], [0, 1], {
    ...clamp,
    easing: Easing.inOut((at) => Easing.cubic(at)),
  });
  const progress =
    frame < JUMPS_AT
      ? interpolate(frame, [0, JUMPS_AT], [BEFORE_THE_INTRO, BEFORE_THE_INTRO + 0.4])
      : frame < RETURNS_FROM
        ? interpolate(jumped, [0, 1], [BEFORE_THE_INTRO + 0.4, PAST_THE_INTRO])
        : interpolate(goesBack, [0, 1], [PAST_THE_INTRO, BEFORE_THE_INTRO]);
  const seconds =
    frame >= JUMPS_AT && frame < RETURNS_FROM
      ? LANDS_AT_SECONDS + (frame - JUMPS_AT) / fps
      : interpolate(
          progress,
          [BEFORE_THE_INTRO, PAST_THE_INTRO],
          [STARTS_AT_SECONDS, LANDS_AT_SECONDS],
        );

  return (
    <AbsoluteFill>
      <div className="absolute left-[7.5rem] top-4 flex h-62 w-[31rem] flex-col justify-end overflow-hidden rounded-xl bg-linear-to-br from-accent/30 via-shade/80 to-shade p-3">
        <span
          className="absolute bottom-24 right-4"
          style={{
            opacity: frame < RETURNS_FROM ? offered * (1 - gone) : 0,
            transform: `translateY(${((1 - offered) * 10 + gone * 8).toString()}px) scale(${pressed.toString()})`,
          }}
        >
          <Button size="lg" variant="overlay" className="px-6" onClick={nothing}>
            {describeSkip(THE_INTRO)}
            <Icon of={SkipForwardFilledIcon} size={18} />
          </Button>
        </span>

        <div className="valence-solid flex flex-col gap-2 rounded-lg px-4 py-3 text-text">
          <span className="flex items-center gap-3">
            <span className="relative h-1 min-w-0 flex-1 rounded-full bg-[var(--surface-hover)]">
              <span className="absolute inset-y-0 left-[3%] w-[6%] rounded-full bg-text/25" />
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${progress.toString()}%` }}
              />
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              {clock(seconds)}
              <span className="text-text-muted"> / 41:08</span>
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <Icon of={PauseIcon} size={16} tone="strong" />
            <span className="truncate">The Lantern Keepers · S2 E4 · Low Tide</span>
          </span>
        </div>
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 72, y: 42 },
          { at: 40, x: 72, y: 42 },
          { at: REACHES_AT, x: 90, y: 58 },
          { at: PRESSED_AT, x: 90, y: 58, isPressing: true },
          { at: 150, x: 90, y: 58 },
          { at: 239, x: 72, y: 42 },
        ]}
      />
    </AbsoluteFill>
  );
};

SkipsScene.displayName = 'SkipsScene';

export { SkipsScene };
