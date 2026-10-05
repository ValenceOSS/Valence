import { Check as CheckIcon, Copy as CopyIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { MockPanel } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/MockPanel/MockPanel';
import { Swap } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/Swap/Swap';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';

const LASTS = [
  { id: 'day', label: 'A day' },
  { id: 'week', label: 'A week' },
  { id: 'always', label: 'Until I stop it' },
] as const;

/**
 * A link made for one series, with how long it lasts; pointed at, it is copied.
 */
const ShareLinkPicture = () => (
  <MockPanel title="Share · The Lantern Keepers">
    <span className="flex flex-col gap-3">
      <span className="flex items-center justify-between gap-3">
        <span className="shrink-0 text-sm text-text-muted">Lasts</span>
        <SegmentedRow label="Lasts" size="xs" items={LASTS} value="week" onSelect={nothing} />
      </span>

      <span className="flex items-end gap-2">
        <TextField
          label="The link"
          isLabelHidden
          size="sm"
          value="getvalence.app/s/k3Fz9QwL"
          onValueChange={nothing}
          className="min-w-0 flex-1"
        />
        <Swap
          delay={100}
          className="shrink-0 justify-items-end"
          from={
            <Button size="sm" variant="secondary" onClick={nothing}>
              <Icon of={CopyIcon} size={15} />
              Copy
            </Button>
          }
          to={
            <Button size="sm" variant="confirm" onClick={nothing}>
              <Icon of={CheckIcon} size={15} />
              Copied
            </Button>
          }
        />
      </span>

      <p className="font-body text-xs text-text-muted">
        Anyone with the link can watch. No account needed.
      </p>
    </span>
  </MockPanel>
);

ShareLinkPicture.displayName = 'ShareLinkPicture';

export { ShareLinkPicture };
