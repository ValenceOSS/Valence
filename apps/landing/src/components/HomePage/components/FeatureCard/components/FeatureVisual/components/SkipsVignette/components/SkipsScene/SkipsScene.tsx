import { Pause as PauseIcon, SkipForward as SkipForwardIcon } from '@keyline-icons/react';
import { Cursor as CursorIcon, CursorClick as CursorClickIcon } from '@keyline-icons/react/fill';
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
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const OFFERED_AT = 18;

const REACHES_FROM = 40;

const REACHES_AT = 80;

const PRESSED_AT = 86;

const JUMPS_AT = 94;

const DRIFTS_AT = 120;

const LEAVES_FROM = 216;

const STARTS_AT_SECONDS = 192;

const LANDS_AT_SECONDS = 280;

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
 * An episode playing into its intro, the skip offered, a pointer gliding over to press it, and the
 * playhead jumping past the part already known.
 */
const SkipsScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const ease = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const shown = interpolate(frame, [0, 10, LEAVES_FROM, durationInFrames - 1], [0, 1, 1, 0], ease);
  const offered = spring({
    frame: frame - OFFERED_AT,
    fps,
    config: { damping: 15, stiffness: 150 },
  });
  const gone = interpolate(frame, [PRESSED_AT + 4, PRESSED_AT + 14], [0, 1], ease);
  const pressed = frame >= PRESSED_AT && frame < PRESSED_AT + 6 ? 0.94 : 1;
  const jumped = spring({ frame: frame - JUMPS_AT, fps, config: { damping: 18, stiffness: 120 } });
  const playedFor = frame / fps;
  const seconds =
    frame < JUMPS_AT
      ? STARTS_AT_SECONDS + playedFor
      : LANDS_AT_SECONDS + playedFor - JUMPS_AT / fps;
  const progress = frame < JUMPS_AT ? 7 + playedFor * 0.3 : interpolate(jumped, [0, 1], [8, 12]);
  const reach = interpolate(frame, [REACHES_FROM, REACHES_AT], [0, 1], {
    ...ease,
    easing: Easing.inOut(Easing.cubic),
  });
  const drift = interpolate(frame, [DRIFTS_AT, DRIFTS_AT + 40], [0, 1], {
    ...ease,
    easing: Easing.inOut(Easing.cubic),
  });
  const pointerX = 46 + 36 * reach - 20 * drift;
  const pointerY = 92 - 30 * reach + 18 * drift;
  const isClicking = frame >= PRESSED_AT && frame < PRESSED_AT + 8;

  return (
    <AbsoluteFill
      className="flex flex-col justify-end overflow-hidden rounded-xl bg-linear-to-br from-accent/30 via-shade/80 to-shade p-2.5"
      style={{ opacity: shown }}
    >
      <span
        className="absolute bottom-20 right-3"
        style={{
          opacity: offered * (1 - gone),
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

      <span
        className="absolute text-on-scrim drop-shadow-[0_2px_4px_rgb(0_0_0/0.5)]"
        style={{ left: `${pointerX.toString()}%`, top: `${pointerY.toString()}%` }}
      >
        <Icon of={isClicking ? CursorClickIcon : CursorIcon} size={22} />
      </span>
    </AbsoluteFill>
  );
};

SkipsScene.displayName = 'SkipsScene';

export { SkipsScene };
