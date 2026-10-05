import {
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';

const DEVICES = [
  { icon: MonitorIcon, name: 'Living room TV', source: '4K HEVC · HDR10 · TrueHD 7.1' },
  { icon: SmartphoneIcon, name: 'Maya’s phone', source: 'Converting to H.264 1080p on NVENC' },
  { icon: LaptopIcon, name: 'Study laptop', source: 'AV1 1080p · Opus 5.1' },
] as const;

const ARRIVES_EVERY = 9;

const CONVERTS_FROM = 40;

const CONVERTS_TO = 120;

const FINDS_IT_DIRECT = 132;

const LEAVES_FROM = 216;

/**
 * Three devices arriving one after another to watch at once, the phone being converted for until it
 * turns out to take the file as it is, when its badge goes from Converting to Direct.
 */
const DevicesScene = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const leaving = interpolate(frame, [LEAVES_FROM, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const converted = interpolate(frame, [CONVERTS_FROM, CONVERTS_TO], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const isDirect = frame >= FINDS_IT_DIRECT;
  const pop = spring({
    frame: frame - FINDS_IT_DIRECT,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  return (
    <AbsoluteFill style={{ opacity: leaving, justifyContent: 'center' }}>
      <MockPanel title="Playing now" isFlush>
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {DEVICES.map((device, at) => {
            const arrived = spring({
              frame: frame - at * ARRIVES_EVERY,
              fps,
              config: { damping: 16, stiffness: 140 },
            });
            const isPhone = at === 1;

            return (
              <li
                key={device.name}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  opacity: arrived,
                  transform: `translateY(${interpolate(arrived, [0, 1], [10, 0]).toString()}px)`,
                }}
              >
                <span className="flex aspect-video w-12 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-hover)]">
                  <Icon of={device.icon} size={16} tone="muted" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-text">{device.name}</span>
                  <span className="truncate text-xs text-text-muted">
                    {isPhone && isDirect ? 'HEVC 1080p, played as it is' : device.source}
                  </span>
                  {isPhone && !isDirect ? (
                    <span className="relative h-0.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                        style={{ width: `${(converted * 100).toString()}%` }}
                      />
                    </span>
                  ) : null}
                </span>

                {isPhone && !isDirect ? (
                  <Badge size="sm" tone="accent">
                    Converting
                  </Badge>
                ) : (
                  <span
                    style={isPhone ? { transform: `scale(${(0.85 + 0.15 * pop).toString()})` } : {}}
                  >
                    <Badge size="sm" tone="success">
                      Direct
                    </Badge>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </MockPanel>
    </AbsoluteFill>
  );
};

DevicesScene.displayName = 'DevicesScene';

export { DevicesScene };
