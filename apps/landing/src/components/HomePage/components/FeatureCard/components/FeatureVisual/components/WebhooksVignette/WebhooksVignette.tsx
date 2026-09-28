import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const HOOKS = [
  {
    name: 'Discord announcements',
    url: 'https://discord.example/api/webhooks/81…',
    sent: 'Tried 30 seconds ago',
    failed: true,
  },
  {
    name: 'Home Assistant',
    url: 'http://homeassistant.lan/api/webhook/valence',
    sent: 'Sent 2 minutes ago',
    failed: false,
  },
] as const;

/**
 * The admin page of webhooks with their last delivery; pointed at, the one that failed is sent again and this time answered.
 */
const WebhooksVignette = () => (
  <MockPanel title="Webhooks" isFlush>
    <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
      {HOOKS.map((hook) => (
        <li key={hook.name} className="flex flex-col gap-2 px-4 py-3">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text">{hook.name}</span>
            {hook.failed ? (
              <Swap
                delay={400}
                from={<Badge tone="danger">Failed · 500</Badge>}
                to={<Badge tone="success">Delivered · 200</Badge>}
              />
            ) : (
              <Badge tone="success">Delivered · 200</Badge>
            )}
          </span>
          <span className="break-all text-xs text-text-muted">{hook.url}</span>
          <span className="text-xs text-text-muted">
            {hook.failed ? (
              <Swap delay={400} from={hook.sent} to="Sent just now, 212 ms" />
            ) : (
              hook.sent
            )}
          </span>
          {hook.failed ? (
            <span
              className={cn(
                'grid grid-rows-[1fr]',
                ACTING,
                'delay-400 acted:grid-rows-[0fr] acted:opacity-0',
              )}
            >
              <span className="min-h-0 overflow-hidden text-xs text-danger">
                The server answered 500 Internal Server Error
              </span>
            </span>
          ) : null}
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn('flex', hook.failed ? cn(ACTING, 'duration-150 acted:scale-95') : '')}
            >
              <Button variant="secondary" size="sm" onClick={nothing}>
                {hook.failed ? 'Redeliver' : 'Send a test'}
              </Button>
            </span>
            <Button variant="secondary" size="sm" onClick={nothing}>
              History
            </Button>
          </span>
        </li>
      ))}
    </ul>
  </MockPanel>
);

WebhooksVignette.displayName = 'WebhooksVignette';

export { WebhooksVignette };
