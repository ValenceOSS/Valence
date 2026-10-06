import { Button } from '@ValenceUI/Button';
import { HistoryArrows } from '@ValenceUI/HistoryArrows';
import { Icon } from '@ValenceUI/Icon';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Download as DownloadIcon, Question as QuestionIcon } from '@keyline-icons/react/fill';
import { NotificationBell } from '@ValenceScreens/components/NotificationBell/NotificationBell';
import { cn } from '@ValenceUI/cn';
import { WindowControls } from './components/WindowControls/WindowControls';
import type { WindowBarProps } from './WindowBar.types';
import { say } from '@ValenceI18n/say';

/**
 * The strip a frameless window draws along its own top, where the system would otherwise put one.
 *
 * Every desktop platform needs somewhere to pick the window up by. On Windows and Linux this draws
 * minimise, maximise and close itself, at the far right. macOS draws its traffic lights over the top
 * left, and there the strip is the height of the band the lights sit in, and what it carries follows
 * on from them at the same pitch, so the row reads as one.
 *
 * At the top left, clear of the traffic lights, are back and forward through the window's history,
 * joined as one control, with an arrow dimmed where there is nowhere to go that way and the keys for
 * each named once the pointer rests on it. At the top right are the inbox, the question mark that
 * opens the Valence docs in the browser, and the update once there is one — a green arrow to fetch a
 * release that has been found, how far one being fetched has got, in words with a bar filling
 * beneath them, and the arrow again to try a failed one. Nothing else asks about a release: the
 * arrow is there for whoever wants it and costs nobody else anything. Where the window's own
 * controls are drawn, a rule stands between them and those.
 *
 * Everything that answers a press is marked `no-drag`, so a press reaches it rather than moving the
 * window — the rest of the strip is for picking the window up by.
 *
 * While a film plays it takes no room at all: the film runs to the top of the window, and this and
 * the window's controls come and go over it with the player's controls.
 *
 * @param update - Where an update has got to, or nothing where there is none.
 * @param onUpdate - Told to fetch the update and restart into it.
 * @param ways - Which ways the window's history goes, and how to go each, where it has one.
 * @param keys - The keys that go back and forward, for the arrows to name.
 * @param inbox - The inbox, where somebody is signed in to have one.
 * @param onHelp - Told to open the Valence docs.
 * @param frame - Minimise, maximise and close, where this draws them rather than the system.
 */
const WindowBar = ({ update, onUpdate, ways, keys, inbox, onHelp, frame }: WindowBarProps) => (
  <div
    data-slot="window-bar"
    className={cn(
      'fixed inset-x-0 top-0 z-[60] flex h-[var(--valence-window-bar-height)] items-center justify-between border-b border-[var(--surface-line)] bg-[color-mix(in_oklab,var(--color-surface-raised)_88%,var(--color-surface))] pl-[var(--valence-window-bar-lead)] text-on-scrim [-webkit-app-region:drag]',
      frame === undefined ? 'pr-[var(--valence-window-bar-clearance)]' : null,
    )}
  >
    {ways === undefined ? (
      <span />
    ) : (
      <HistoryArrows
        canGoBack={ways.canGoBack}
        canGoForward={ways.canGoForward}
        onBack={ways.back}
        onForward={ways.forward}
        backLabel={say('common.goBack')}
        forwardLabel={say('screens.windowBar.goForward')}
        {...(keys === undefined ? {} : { backKeys: keys.back, forwardKeys: keys.forward })}
        className="[-webkit-app-region:no-drag]"
      />
    )}

    <div className="flex items-center gap-1 self-stretch [-webkit-app-region:no-drag]">
      {inbox === undefined ? null : <NotificationBell {...inbox} isInTheWindowBar />}

      {onHelp === undefined ? null : (
        <Button
          variant="ghost"
          size="none"
          isIconOnly
          label={say('common.help')}
          onClick={onHelp}
          className="size-6 rounded-md"
        >
          <Icon of={QuestionIcon} size={15} />
        </Button>
      )}

      {update === undefined || update.kind === 'none' ? null : update.kind === 'downloading' ? (
        <div role="status" className="flex min-w-[5.75rem] flex-col gap-1 px-1">
          <span className="text-[0.6875rem] uppercase leading-none tracking-wide tabular-nums opacity-70">
            {say('screens.windowBar.updatingPercent', { percent: update.percent.toString() })}
          </span>

          <ProgressBar
            label={say('screens.windowBar.updatingPercent', { percent: update.percent.toString() })}
            value={update.percent}
            isFull
            isThin
          />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="none"
          isIconOnly
          label={
            update.kind === 'failed'
              ? say('screens.windowBar.retryUpdate')
              : say('common.updateToVersion', { version: update.version })
          }
          onClick={onUpdate}
          className={
            update.kind === 'failed'
              ? 'size-6 rounded-md text-danger'
              : 'size-6 rounded-md text-success'
          }
        >
          <Icon of={DownloadIcon} size={15} />
        </Button>
      )}

      {frame === undefined ? null : (
        <WindowControls
          isMaximised={frame.isMaximised}
          onMinimise={frame.minimise}
          onMaximise={frame.maximise}
          onClose={frame.close}
        />
      )}
    </div>
  </div>
);

WindowBar.displayName = 'WindowBar';

export { WindowBar };
