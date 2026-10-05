import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Badge } from '@ValenceUI/Badge';
import { Dusk } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HdrVignette/components/HdrScene/components/Dusk/Dusk';

const SWEEP = [0, 30, 96, 120, 186, 239] as const;

const LINE_AT = [50, 50, 14, 14, 86, 50] as const;

/**
 * The standard-range half and the high-range half of one dusk, a line sweeping between them.
 */
const HdrScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [...SWEEP], [...LINE_AT], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const glow = 0.5 + 0.5 * Math.sin((frame / 240) * Math.PI * 4);
  const badges = spring({ frame: frame - 6, fps, config: { damping: 14, stiffness: 160 } });

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

      <span className="absolute left-2.5 top-2.5 flex gap-1" style={{ opacity: badges }}>
        <Badge size="sm" tone="outline" className="text-on-scrim">
          SDR
        </Badge>
      </span>
      <span
        className="absolute right-2.5 top-2.5 flex gap-1 text-on-scrim"
        style={{ opacity: badges, transform: `scale(${(0.9 + 0.1 * badges).toString()})` }}
      >
        <Badge size="sm" tone="outline" className="text-on-scrim">
          4K
        </Badge>
        <Badge size="sm" tone="outline" className="text-on-scrim">
          HDR10
        </Badge>
      </span>
    </AbsoluteFill>
  );
};

HdrScene.displayName = 'HdrScene';

export { HdrScene };
