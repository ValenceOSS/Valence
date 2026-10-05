import {
  Bin as BinIcon,
  Copy as CopyIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const KEYS = [
  {
    name: 'Home Assistant',
    start: 'vk_7Qm2',
    used: 'Used 2 minutes ago',
    limit: '60 per 60s',
    isOn: true,
  },
  {
    name: 'Backup script',
    start: 'vk_c41e',
    used: 'Used yesterday',
    limit: '3 permissions',
    isOn: false,
  },
] as const;

/**
 * The keys an account has made; pointed at, a new one is made and shown in full, once.
 */
const ApiKeysPicture = () => (
  <MockPanel title="API keys">
    <span className="flex flex-col gap-2">
      <span
        className={cn(
          'grid grid-rows-[0fr] opacity-0',
          ACTING,
          'acted:grid-rows-[1fr] acted:opacity-100',
        )}
      >
        <span className="min-h-0 overflow-hidden">
          <span className="mb-2 flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-text">
              <Icon of={TriangleAlertIcon} size={16} />
              Copy Discord bot now, it will not be shown again.
            </span>
            <span className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2 font-mono text-xs text-text">
                vk_Hn4r8TzQ2mWc07bdLx
              </code>
              <Button size="sm" variant="secondary" onClick={nothing}>
                <Icon of={CopyIcon} size={15} />
                Copy
              </Button>
            </span>
          </span>
        </span>
      </span>

      {KEYS.map((key) => (
        <span
          key={key.name}
          className="flex items-center gap-3 rounded-lg border border-[var(--surface-line)] p-3"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-text">{key.name}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <code className="font-mono">{key.start}…</code>
              <span>·</span>
              {key.used}
              <Badge size="sm">{key.limit}</Badge>
            </span>
          </span>
          <Switch
            label={`Turn ${key.name} on or off`}
            isLabelHidden
            isOn={key.isOn}
            onToggle={nothing}
          />
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={`Revoke ${key.name}`}
            onClick={nothing}
          >
            <Icon of={BinIcon} size={16} />
          </Button>
        </span>
      ))}
    </span>
  </MockPanel>
);

ApiKeysPicture.displayName = 'ApiKeysPicture';

export { ApiKeysPicture };
