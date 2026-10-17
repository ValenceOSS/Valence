import { CircleArrowDown as CircleArrowDownFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { say } from '@ValenceI18n/say';
import { AccelerationNote } from '@ValenceScreens/components/AdminPage/components/AccelerationNote/AccelerationNote';
import type { AdminStatusFooterProps } from './AdminStatusFooter.types';

const PILL_LOOKS = {
  quiet: 'border-success/25 bg-success/10 text-success',
  warning: 'border-busy/25 bg-busy/10 text-busy',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  update: 'border-highlight/30 bg-highlight/10 text-highlight',
} as const;

/**
 * The foot of the admin sidebar: how this server converts video, and a pill with the release it
 * runs, coloured by how the server is doing — green, amber or red — or, when a newer release is out,
 * naming that one in the update colour. Pressing the pill opens the updates page.
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
}: AdminStatusFooterProps) => {
  const look = latest === null ? (acceleration?.tone ?? 'quiet') : 'update';

  return (
    <div className="flex min-w-0 items-center gap-3 border-t border-[var(--surface-line)] px-2.5 pt-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[0.8125rem] font-medium text-text">
          {say('common.valence')}
        </span>

        {acceleration === null ? null : (
          <span className="min-w-0 text-xs text-text-muted">
            <AccelerationNote
              acceleration={acceleration}
              ffmpeg={ffmpeg}
              side="top"
              align="start"
              isBlock
            />
          </span>
        )}
      </span>

      {version === null ? null : (
        <Button
          variant="bare"
          size="none"
          label={
            latest === null
              ? say('screens.adminPage.valenceVersion', { version })
              : say('common.updateToVersion', { version: latest })
          }
          onClick={onOpenUpdates}
          className={cn(
            'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium tabular-nums',
            PILL_LOOKS[look],
          )}
        >
          {latest === null ? null : <Icon of={CircleArrowDownFilledIcon} size={12} />}
          {latest ?? version}
        </Button>
      )}
    </div>
  );
};

AdminStatusFooter.displayName = 'AdminStatusFooter';

export { AdminStatusFooter };
