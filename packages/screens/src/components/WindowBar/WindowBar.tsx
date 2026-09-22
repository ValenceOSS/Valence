import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Download as DownloadIcon } from '@keyline-icons/react';
import type { WindowBarProps } from './WindowBar.types';

/**
 * The strip a frameless window draws along its own top, where the system would otherwise put one.
 *
 * Every desktop platform needs somewhere to pick the window up by. Windows and Linux draw their own
 * minimise, maximise and close over the top right, transparent, so this shows through behind them.
 * macOS draws its traffic lights over the top left the same way. Either way this asks nothing of the
 * page under it beyond the room reserved for it — it draws a surface and nothing on it, so nothing
 * here is announced to somebody looking at anything but the window itself, unless there is a
 * release worth their pressing it for.
 *
 * The one thing it will say sits at the top right, clear of the traffic lights macOS draws at the
 * top left. On macOS that is the whole of the clearance it needs, since nothing else is drawn over
 * the top right there — on Windows and Linux, where the system's own controls are, `--valence-
 * window-bar-clearance` widens to leave room for them instead. It is marked `no-drag` so a press
 * reaches it rather than moving the window, which is the one place in this whole strip that has to
 * answer a click instead of a grab.
 *
 * @param updateVersion - The version waiting to be installed, or nothing where none is.
 * @param onInstallUpdate - Told to install it and restart, once there is one downloaded to install.
 */
const WindowBar = ({ updateVersion, onInstallUpdate }: WindowBarProps) => (
  <div
    data-slot="window-bar"
    className="fixed inset-x-0 top-0 z-[60] flex h-8 items-center justify-end bg-surface pr-[var(--valence-window-bar-clearance)] [-webkit-app-region:drag]"
  >
    {updateVersion === undefined ? null : (
      <Button
        variant="ghost"
        size="xs"
        hasTooltip={false}
        onClick={onInstallUpdate}
        className="h-6 gap-1 px-2 text-[0.6875rem] uppercase tracking-wide text-on-scrim opacity-70 hover:opacity-100 [-webkit-app-region:no-drag]"
      >
        <Icon of={DownloadIcon} size={13} />
        Update available
      </Button>
    )}
  </div>
);

WindowBar.displayName = 'WindowBar';

export { WindowBar };
