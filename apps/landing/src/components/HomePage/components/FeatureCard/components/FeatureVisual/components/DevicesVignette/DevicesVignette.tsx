import {
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Icon } from '@ValenceUI/Icon';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';

const DEVICES = [
  {
    icon: MonitorIcon,
    name: 'Living room TV',
    source: '4K HEVC · HDR10 · TrueHD 7.1',
    becomes: null,
  },
  {
    icon: SmartphoneIcon,
    name: 'Maya’s phone',
    source: 'Converting to H.264 1080p on NVENC',
    becomes: 'HEVC 1080p, played as it is',
  },
  { icon: LaptopIcon, name: 'Study laptop', source: 'AV1 1080p · Opus 5.1', becomes: null },
] as const;

/**
 * Three devices watching at once, each told what it gets; pointed at, the phone that was being converted for finds it can take the file as it is.
 */
const DevicesVignette = () => (
  <MockPanel title="Playing now" isFlush>
    <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
      {DEVICES.map((device) => (
        <li key={device.name} className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex aspect-video w-12 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-hover)]">
            <Icon of={device.icon} size={16} tone="muted" />
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-text">{device.name}</span>
            <span className="truncate text-xs text-text-muted">
              {device.becomes === null ? (
                device.source
              ) : (
                <Swap from={device.source} to={device.becomes} />
              )}
            </span>
          </span>

          {device.becomes === null ? (
            <Badge size="sm" tone="success">
              Direct
            </Badge>
          ) : (
            <Swap
              delay={120}
              className="justify-items-end"
              from={
                <Badge size="sm" tone="accent">
                  Converting
                </Badge>
              }
              to={
                <Badge size="sm" tone="success">
                  Direct
                </Badge>
              }
            />
          )}
        </li>
      ))}
    </ul>
  </MockPanel>
);

DevicesVignette.displayName = 'DevicesVignette';

export { DevicesVignette };
