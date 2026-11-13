import {
  CircleArrowDown as CircleArrowDownFilledIcon,
  CircleCheck as CircleCheckFilledIcon,
} from '@keyline-icons/react/fill';
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
 * naming that one in the update colour. The release is followed by a mark saying which: a tick
 * while it is current, an arrow when there is something newer. Pressing the pill opens the updates
 * page. In a bar across the top it stands as tall as the controls beside it.
 *
 * @param version - The release this server runs, or null before it has said.
 * @param acceleration - How it converts video, or null before it has said.
 * @param ffmpeg - What to say about its FFmpeg, if anything.
 * @param latest - The newer release, or the commit of the newer dev build, where one is out.
 * @param isLatestADevBuild - Whether what is newer is a dev build rather than a release.
 * @param onOpenUpdates - Called to open the updates page.
 * @param isInHeader - Whether it sits at the end of a bar across the top rather than a sidebar's foot.
 * @param isPillOnly - Whether only the pill is drawn, for a bar with no room for how video is
 *   converted.
 */
const AdminStatusFooter = ({
  version,
  acceleration,
  ffmpeg,
  latest,
  isLatestADevBuild = false,
  onOpenUpdates,
  isInHeader = false,
  isPillOnly = false,
}: AdminStatusFooterProps) => {
  const look = latest === null ? (acceleration?.tone ?? 'quiet') : 'update';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3',
        isInHeader ? 'shrink-0' : 'border-t border-[var(--surface-line)] px-2.5 pt-3',
      )}
    >
      {isPillOnly ? null : (
        <span className={cn('flex min-w-0 flex-col', isInHeader ? 'items-end text-end' : 'flex-1')}>
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
      )}

      {version === null ? null : (
        <Button
          variant="bare"
          size="none"
          label={
            latest === null
              ? say('screens.adminPage.valenceVersion', { version })
              : isLatestADevBuild
                ? say('common.updateToDevBuild', { commit: latest })
                : say('common.updateToVersion', { version: latest })
          }
          onClick={onOpenUpdates}
          className={cn(
            'inline-flex shrink-0 items-center rounded-full border font-medium tabular-nums',
            isInHeader
              ? 'h-8 gap-1.5 pe-2.5 ps-3 text-[0.8125rem]'
              : 'h-6 gap-1 pe-1.5 ps-2 text-xs',
            PILL_LOOKS[look],
          )}
        >
          {latest ?? version}
          <Icon
            of={latest === null ? CircleCheckFilledIcon : CircleArrowDownFilledIcon}
            size={isInHeader ? 14 : 12}
          />
        </Button>
      )}
    </div>
  );
};

AdminStatusFooter.displayName = 'AdminStatusFooter';

export { AdminStatusFooter };
