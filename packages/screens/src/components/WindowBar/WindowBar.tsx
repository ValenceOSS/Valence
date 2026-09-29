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
 * page under it beyond the room reserved for it — it draws the same raised surface as the admin
 * sidebar and nothing on it, so nothing here is announced to somebody looking at anything but the
 * window itself, unless there is a release worth their pressing it for.
 *
 * While a film plays it takes no room at all: the film runs to the top of the window, and this and
 * the system's own controls come and go over it with the player's controls.
 *
 * The one thing it will say is where an update has got to, at the top right, clear of the traffic
 * lights macOS draws at the top left. On macOS that is the whole of the clearance it needs, since
 * nothing else is drawn over the top right there — on Windows and Linux, where the system's own
 * controls are, `--valence-window-bar-clearance` widens to leave room for them instead. A release
 * that has been found is a button to fetch it, one being fetched says how far it has got, and one
 * that failed is a button to try again. A button is marked `no-drag` so a press reaches it rather
 * than moving the window, which is the one place in this whole strip that has to answer a click
 * instead of a grab.
 *
 * @param update - Where an update has got to, or nothing where there is none.
 * @param onUpdate - Told to fetch the update and restart into it.
 */
const WindowBar = ({ update, onUpdate }: WindowBarProps) => (
  <div
    data-slot="window-bar"
    className="fixed inset-x-0 top-0 z-[60] flex h-8 items-center justify-end border-b border-[var(--surface-line)] bg-[color-mix(in_oklab,var(--color-surface-raised)_88%,var(--color-surface))] pr-[var(--valence-window-bar-clearance)] [-webkit-app-region:drag]"
  >
    {update === undefined || update.kind === 'none' ? null : update.kind === 'downloading' ? (
      <span
        role="status"
        className="px-2 text-[0.6875rem] uppercase tracking-wide text-on-scrim opacity-70"
      >
        Updating {update.percent.toString()}%
      </span>
    ) : (
      <Button
        variant="ghost"
        size="xs"
        hasTooltip={false}
        onClick={onUpdate}
        className="h-6 gap-1 px-2 text-[0.6875rem] uppercase tracking-wide text-on-scrim opacity-70 hover:opacity-100 [-webkit-app-region:no-drag]"
      >
        <Icon of={DownloadIcon} size={13} />
        {update.kind === 'failed' ? 'Retry update' : `Update to ${update.version}`}
      </Button>
    )}
  </div>
);

WindowBar.displayName = 'WindowBar';

export { WindowBar };
