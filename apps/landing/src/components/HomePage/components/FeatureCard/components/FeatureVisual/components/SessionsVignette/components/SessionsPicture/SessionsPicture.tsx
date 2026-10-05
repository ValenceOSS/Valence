import {
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
} from '@keyline-icons/react';
import { Pause as PauseIcon, Stop as StopIcon } from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const SESSIONS = [
  {
    who: 'Maya',
    title: 'Harbour Lights',
    device: MonitorIcon,
    where: 'Living room TV',
    way: 'Direct',
    at: 71,
    isNew: false,
  },
  {
    who: 'Jonah',
    title: 'The Lantern Keepers',
    device: SmartphoneIcon,
    where: 'Pixel 9',
    way: 'Converting',
    at: 23,
    isNew: false,
  },
  {
    who: 'Theo',
    title: 'Northbound',
    device: TabletIcon,
    where: 'iPad mini',
    way: 'Direct',
    at: 4,
    isNew: true,
  },
] as const;

/**
 * The admin page of who is watching now; pointed at, somebody else starts and their session arrives.
 */
const SessionsPicture = () => (
  <MockPanel
    title="Now playing"
    actions={
      <Swap
        className="justify-items-end"
        delay={200}
        from={<Badge size="sm">2 streams</Badge>}
        to={<Badge size="sm">3 streams</Badge>}
      />
    }
  >
    <span className="flex flex-col">
      {SESSIONS.map((session) => (
        <span
          key={session.who}
          className={cn(
            'grid',
            session.isNew
              ? cn('grid-rows-[0fr] opacity-0', ACTING, 'acted:grid-rows-[1fr] acted:opacity-100')
              : 'grid-rows-[1fr]',
          )}
        >
          <span className="min-h-0 overflow-hidden">
            <span className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-lg border border-[var(--surface-line)] bg-surface p-2">
              <span className="flex aspect-video w-14 shrink-0 items-center justify-center rounded-sm bg-[var(--surface-hover)]">
                <Icon of={session.device} size={16} tone="muted" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-text">{session.who}</span>
                  <Badge size="sm">{session.way}</Badge>
                </span>
                <span className="truncate text-xs text-text-muted">{session.title}</span>
                <span className="relative block h-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${session.at.toString()}%` }}
                  />
                </span>
              </span>
              <span className="flex shrink-0 items-center">
                <Button isIconOnly variant="ghost" size="sm" label="Pause" onClick={nothing}>
                  <Icon of={PauseIcon} size={14} />
                </Button>
                <Button isIconOnly variant="ghost" size="sm" label="Stop" onClick={nothing}>
                  <Icon of={StopIcon} size={14} />
                </Button>
              </span>
            </span>
          </span>
        </span>
      ))}
    </span>
  </MockPanel>
);

SessionsPicture.displayName = 'SessionsPicture';

export { SessionsPicture };
