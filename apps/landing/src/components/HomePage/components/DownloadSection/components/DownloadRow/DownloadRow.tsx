import {
  IconBrandAppleFilled,
  IconBrandWindowsFilled,
  IconDownloadFilled,
} from '@tabler/icons-react';
import { LinuxMark } from '@ValenceLanding/components/HomePage/components/DownloadSection/components/LinuxMark/LinuxMark';
import { Button } from '@ValenceUI/Button';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { DownloadRowProps } from './DownloadRow.types';

const ICONS = {
  macAppleSilicon: IconBrandAppleFilled,
  macIntel: IconBrandAppleFilled,
  windows: IconBrandWindowsFilled,
  linux: LinuxMark,
} as const;

/**
 * One of the other desktop downloads, as a line in a list: which computer it is for, the file it
 * is and how big, and a button that fetches it.
 *
 * @param choice - The download.
 */
const DownloadRow = ({ choice }: DownloadRowProps) => {
  const Glyph = ICONS[choice.id];

  return (
    <li className="flex items-center gap-3 py-3">
      <Glyph size={18} className="shrink-0 text-text-muted" />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold text-text">
          {choice.system} <span className="font-normal text-text-muted">{choice.detail}</span>
        </span>

        <span className="truncate font-mono text-xs text-text-muted/80">
          {choice.fileName ?? 'On the release page'}
          {choice.sizeBytes === null ? '' : ` · ${formatBytes(choice.sizeBytes)}`}
        </span>
      </span>

      <Button
        variant="secondary"
        size="sm"
        aria-label={`Download for ${choice.system}, ${choice.detail}`}
        hasTooltip={false}
        onClick={() => {
          window.location.assign(choice.url);
        }}
      >
        <IconDownloadFilled size={15} />
        Download
      </Button>
    </li>
  );
};

DownloadRow.displayName = 'DownloadRow';

export { DownloadRow };
