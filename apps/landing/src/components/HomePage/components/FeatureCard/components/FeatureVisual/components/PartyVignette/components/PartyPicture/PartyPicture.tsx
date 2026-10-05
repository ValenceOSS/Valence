import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { ACTING } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/ACTING';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { MockFace } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockFace/MockFace';

const FACES = [
  {
    name: 'Maya',
    tone: 'bg-accent',
    drift: 'left-[40%] -top-8',
    synced: 'acted:left-[calc(50%-1.25rem)] acted:-top-7',
  },
  {
    name: 'Jonah',
    tone: 'bg-success',
    drift: 'left-[50%] -top-6',
    synced: 'acted:left-1/2 acted:-top-7',
  },
  {
    name: 'Ruth',
    tone: 'bg-danger',
    drift: 'left-[62%] -top-9',
    synced: 'acted:left-[calc(50%+1.25rem)] acted:-top-7',
  },
] as const;

/**
 * Three people watching one film who have drifted apart; pointed at, their faces snap back into line on the one playhead.
 */
const PartyPicture = () => (
  <MockPanel
    title="Watch party"
    actions={
      <Swap
        className="justify-items-end"
        from={
          <Badge size="sm" tone="warning">
            Drifting 1.2s
          </Badge>
        }
        to={
          <Badge size="sm" tone="success">
            In sync
          </Badge>
        }
      />
    }
  >
    <span className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text">Friday film night</span>
      <span className="relative mt-9 h-1 w-full rounded-full bg-[var(--surface-hover)]">
        <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary" />
        {FACES.map((face) => (
          <span
            key={face.name}
            className={cn(
              'absolute -translate-x-1/2',
              face.drift,
              ACTING,
              'duration-700',
              face.synced,
            )}
          >
            <MockFace
              name={face.name}
              tone={face.tone}
              className="size-6 text-[0.625rem] ring-2 ring-surface-raised"
            />
          </span>
        ))}
      </span>
      <span className="flex justify-between text-xs tabular-nums text-text-muted">
        <span>1:07:20</span>
        <span>2:14:40</span>
      </span>
    </span>
  </MockPanel>
);

PartyPicture.displayName = 'PartyPicture';

export { PartyPicture };
