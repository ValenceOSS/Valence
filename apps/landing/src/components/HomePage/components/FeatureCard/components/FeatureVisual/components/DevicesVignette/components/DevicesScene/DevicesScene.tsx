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
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';

const DEVICES = [
  { icon: MonitorIcon, name: 'Living room TV', source: '4K HEVC · HDR10 · TrueHD 7.1' },
  { icon: SmartphoneIcon, name: 'Maya’s phone', source: 'Converting to H.264 1080p on NVENC' },
  { icon: LaptopIcon, name: 'Study laptop', source: 'AV1 1080p · Opus 5.1' },
] as const;

const CONVERTS_FROM = 20;

const CONVERTS_TO = 104;

const FINDS_IT_DIRECT = 116;

const NEXT_EPISODE_FROM = 204;

const NEXT_EPISODE_TO = 222;

/**
 * Three devices watching at once, the phone being converted for until it turns out to take the file
 * as it is, when its badge goes from Converting to Direct — and then, as its next episode starts,
 * being asked about again, which is where it began, so it goes round without a seam.
 */
const DevicesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const converted = interpolate(frame, [CONVERTS_FROM, CONVERTS_TO], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const isDirect = frame >= FINDS_IT_DIRECT && frame < NEXT_EPISODE_FROM;
  const pop = spring({
    frame: frame - FINDS_IT_DIRECT,
    fps,
    config: { damping: 12, stiffness: 180 },
  });
  const restarting = interpolate(
    frame,
    [NEXT_EPISODE_FROM, (NEXT_EPISODE_FROM + NEXT_EPISODE_TO) / 2, NEXT_EPISODE_TO],
    [1, 0, 1],
    clamp,
  );

  return (
    <AbsoluteFill style={{ justifyContent: 'center' }}>
      <MockPanel title="Playing now" isFlush>
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {DEVICES.map((device, at) => {
            const isPhone = at === 1;

            return (
              <li key={device.name} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex aspect-video w-12 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-hover)]">
                  <Icon of={device.icon} size={16} tone="muted" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium text-text">{device.name}</span>
                  <span
                    className="truncate text-xs text-text-muted"
                    style={isPhone ? { opacity: restarting } : {}}
                  >
                    {isPhone && isDirect ? 'HEVC 1080p, played as it is' : device.source}
                  </span>
                  {isPhone ? (
                    <span
                      className="relative h-0.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]"
                      style={{ opacity: isDirect ? 0 : 1 }}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-accent"
                        style={{
                          width: `${(frame >= NEXT_EPISODE_FROM ? 0 : converted * 100).toString()}%`,
                        }}
                      />
                    </span>
                  ) : null}
                </span>

                <span style={isPhone ? { opacity: restarting } : {}}>
                  {isPhone && !isDirect ? (
                    <Badge size="sm" tone="accent">
                      Converting
                    </Badge>
                  ) : (
                    <span
                      className="inline-flex"
                      style={
                        isPhone ? { transform: `scale(${(0.85 + 0.15 * pop).toString()})` } : {}
                      }
                    >
                      <Badge size="sm" tone="success">
                        Direct
                      </Badge>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </MockPanel>

      <SceneCursor
        path={[
          { at: 0, x: 74, y: 96 },
          { at: 24, x: 74, y: 96 },
          { at: 60, x: 60, y: 56 },
          { at: FINDS_IT_DIRECT, x: 62, y: 57 },
          { at: FINDS_IT_DIRECT + 36, x: 58, y: 34 },
          { at: 200, x: 58, y: 34 },
          { at: 239, x: 74, y: 96 },
        ]}
      />
    </AbsoluteFill>
  );
};

DevicesScene.displayName = 'DevicesScene';

export { DevicesScene };
