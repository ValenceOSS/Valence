import { CircleArrowUp as CircleArrowUpFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { AccelerationNote } from '@ValenceScreens/components/AdminPage/components/AccelerationNote/AccelerationNote';
import type { AdminStatusFooterProps } from './AdminStatusFooter.types';

const ACCELERATION_DOTS = {
  quiet: 'bg-success',
  warning: 'bg-busy',
  danger: 'bg-danger',
} as const;

/**
 * The foot of the admin sidebar: which release this server runs and how it converts video, with a
 * dot that turns amber or red when the conversion is not what it should be, and a way to the update
 * when a newer release is out.
 *
 * @param version - The release this server runs, or null before it has said.
 * @param acceleration - How it converts video, or null before it has said.
 * @param ffmpeg - What to say about its FFmpeg, if anything.
 * @param latest - The newer release, where one is out.
 * @param onOpenUpdates - Called to open the updates page.
 */
const AdminStatusFooter = ({
  version,
  acceleration,
  ffmpeg,
  latest,
  onOpenUpdates,
}: AdminStatusFooterProps) => (
  <div className="flex flex-col gap-2 border-t border-[var(--surface-line)] px-1 pt-3">
    <div className="flex min-w-0 items-center gap-2.5 px-1.5">
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          ACCELERATION_DOTS[acceleration?.tone ?? 'quiet'],
        )}
      />

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[0.8125rem] font-medium tabular-nums text-text">
          {version === null
            ? say('common.valence')
            : say('screens.adminPage.valenceVersion', { version })}
        </span>

        {acceleration === null ? null : (
          <span className="truncate text-xs text-text-muted">
            <AccelerationNote
              acceleration={acceleration}
              ffmpeg={ffmpeg}
              side="top"
              align="start"
            />
          </span>
        )}
      </span>
    </div>

    {latest === null ? null : (
      <Button
        variant="secondary"
        size="sm"
        className="w-full justify-start"
        onClick={onOpenUpdates}
      >
        <Icon of={CircleArrowUpFilledIcon} size={14} />
        {say('screens.adminPage.adminStatusFooter.updateToVersion', { version: latest })}
      </Button>
    )}
  </div>
);

AdminStatusFooter.displayName = 'AdminStatusFooter';

export { AdminStatusFooter };
