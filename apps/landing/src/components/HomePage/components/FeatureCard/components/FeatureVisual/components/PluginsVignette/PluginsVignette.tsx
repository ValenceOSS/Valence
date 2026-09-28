import { Badge } from '@ValenceUI/Badge';
import { Checkbox } from '@ValenceUI/Checkbox';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const ASKS = [
  { name: 'Reach the network', detail: 'Only api.subtitles.example', isGiven: true },
  { name: 'Read the library', detail: 'Titles and files, never changed', isGiven: true },
  { name: 'Keep its own files', detail: 'Up to 50 MB', isGiven: true },
  { name: 'See who is watching', detail: 'Your own profile, read only', isGiven: false },
] as const;

/**
 * A plugin asking for what it may touch; pointed at, the one thing it had not been given is granted, and granted narrowly.
 */
const PluginsVignette = () => (
  <MockPanel title="Subtitle Finder asks to" actions={<Badge size="sm">v1.4.0</Badge>}>
    <span className="flex flex-col gap-3">
      {ASKS.map((ask) =>
        ask.isGiven ? (
          <Checkbox
            key={ask.name}
            label={ask.name}
            description={ask.detail}
            checked
            onCheckedChange={nothing}
          />
        ) : (
          <Swap
            key={ask.name}
            className="w-full"
            from={
              <Checkbox
                label={ask.name}
                description={ask.detail}
                checked={false}
                onCheckedChange={nothing}
              />
            }
            to={
              <Checkbox
                label={ask.name}
                description={ask.detail}
                checked
                onCheckedChange={nothing}
              />
            }
          />
        ),
      )}
    </span>
  </MockPanel>
);

PluginsVignette.displayName = 'PluginsVignette';

export { PluginsVignette };
