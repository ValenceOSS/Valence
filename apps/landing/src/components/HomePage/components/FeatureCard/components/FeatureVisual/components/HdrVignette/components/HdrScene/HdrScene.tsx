import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { ChevronsLeftRight as ChevronsLeftRightIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { Dusk } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HdrVignette/components/HdrScene/components/Dusk/Dusk';

const SWEEP = [0, 30, 96, 120, 180, 212, 239] as const;

const LINE_AT = [50, 50, 14, 14, 86, 50, 50] as const;

/**
 * The standard-range half and the high-range half of one dusk, a line sweeping between them.
 */
const HdrScene = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [...SWEEP], [...LINE_AT], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const glow = 0.5 + 0.5 * Math.sin((frame / 240) * Math.PI * 4);

  return (
    <AbsoluteFill className="overflow-hidden rounded-xl">
      <Dusk isFlat={false} glow={glow} />
      <span
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${(100 - line).toString()}% 0 0)` }}
      >
        <Dusk isFlat glow={0} />
      </span>
      <span
        className="absolute inset-y-0 w-px -translate-x-1/2 bg-on-scrim/80"
        style={{ left: `${line.toString()}%` }}
      />
      <span
        className="absolute top-[58%] flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-on-scrim/70 bg-shade/60 text-on-scrim shadow-[0_2px_8px_rgb(0_0_0/0.4)] backdrop-blur-sm"
        style={{ left: `${line.toString()}%` }}
      >
        <Icon of={ChevronsLeftRightIcon} size={14} />
      </span>

      <span className="absolute left-2.5 top-2.5 flex gap-1">
        <Badge size="sm" tone="outline" className="text-on-scrim">
          SDR
        </Badge>
      </span>
      <span className="absolute right-2.5 top-2.5 flex gap-1 text-on-scrim">
        <Badge size="sm" tone="outline" className="text-on-scrim">
          4K
        </Badge>
        <Badge size="sm" tone="outline" className="text-on-scrim">
          HDR10
        </Badge>
      </span>
      <SceneCursor
        look="drag"
        path={[
          { at: 0, x: 72, y: 86 },
          { at: SWEEP[1] - 2, x: LINE_AT[1], y: 58 },
          { at: SWEEP[1], x: LINE_AT[1], y: 58, isPressing: true, holdsUntil: SWEEP[2] },
          { at: SWEEP[2], x: LINE_AT[2], y: 58 },
          { at: SWEEP[3], x: LINE_AT[3], y: 58, isPressing: true, holdsUntil: SWEEP[5] },
          { at: SWEEP[4], x: LINE_AT[4], y: 58 },
          { at: SWEEP[5], x: LINE_AT[5], y: 58 },
          { at: SWEEP[6], x: 72, y: 86 },
        ]}
      />
    </AbsoluteFill>
  );
};

HdrScene.displayName = 'HdrScene';

export { HdrScene };
