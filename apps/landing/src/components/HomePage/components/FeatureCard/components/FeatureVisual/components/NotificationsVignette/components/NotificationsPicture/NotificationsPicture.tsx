import { Bin as BinIcon, CircleCheck as CircleCheckIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const NOTICES = [
  {
    title: 'Ruth started a party',
    body: 'Paper Moons, starting now for everyone',
    when: 'now',
    isNew: true,
    look: 'grid-rows-[0fr] opacity-0 acted:grid-rows-[1fr] acted:opacity-100',
  },
  {
    title: 'New episode',
    body: 'The Lantern Keepers S2 E5 is ready',
    when: '1m',
    isNew: true,
    look: 'grid-rows-[1fr]',
  },
  {
    title: 'Your request arrived',
    body: 'Harbour Lights (2024) was added',
    when: '2h',
    isNew: false,
    look: 'grid-rows-[1fr]',
  },
  {
    title: 'Scan finished',
    body: '12 new titles in Films',
    when: '1d',
    isNew: false,
    look: 'grid-rows-[1fr] acted:grid-rows-[0fr] acted:opacity-0',
  },
] as const;

/**
 * The notification list as the bell opens it; pointed at, another arrives on top and the rest move down beneath it.
 */
const NotificationsPicture = () => (
  <MockPanel
    title="Notifications"
    isFlush
    actions={
      <>
        <Button variant="ghost" size="xs" onClick={nothing}>
          <Icon of={CircleCheckIcon} size={14} />
          Read all
        </Button>
        <Button variant="ghost" size="xs" onClick={nothing}>
          <Icon of={BinIcon} size={14} />
          Clear
        </Button>
      </>
    }
  >
    <ul className="flex flex-col">
      {NOTICES.map((notice) => (
        <li key={notice.title} className={cn('grid', ACTING, notice.look)}>
          <span className="min-h-0 overflow-hidden">
            <span className="flex items-start gap-3 border-b border-[var(--surface-line)] px-4 py-3">
              <span
                className={
                  notice.isNew
                    ? 'mt-1.5 size-2 shrink-0 rounded-full bg-accent'
                    : 'mt-1.5 size-2 shrink-0'
                }
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex w-full items-baseline gap-2">
                  <span
                    className={
                      notice.isNew
                        ? 'truncate text-sm font-medium text-text'
                        : 'truncate text-sm text-text-muted'
                    }
                  >
                    {notice.title}
                  </span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
                    {notice.when}
                  </span>
                </span>
                <span className="text-xs text-text-muted">{notice.body}</span>
              </span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  </MockPanel>
);

NotificationsPicture.displayName = 'NotificationsPicture';

export { NotificationsPicture };
