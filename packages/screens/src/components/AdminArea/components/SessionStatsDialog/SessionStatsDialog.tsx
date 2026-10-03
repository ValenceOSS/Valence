import { sayAgain } from '@ValenceI18n/sayAgain';
import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react/fill';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Button } from '@ValenceUI/Button';
import {
  describeAxis,
  describeVideoAxis,
  describeAudioAxis,
} from '@ValenceCore/functions/describePlaybackAxis';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import type { SessionStatsDialogProps } from './SessionStatsDialog.types';
import { say } from '@ValenceI18n/say';

type RowProps = {
  name: string;
  children: string;
};

/**
 * One labelled fact in the statistics list, laid out so the labels line up down the column and long
 * values wrap rather than pushing the layout wide.
 *
 * @param name - What the fact is.
 * @param children - The fact itself.
 */
const Row = ({ name, children }: RowProps) => (
  <div className="flex gap-3 rounded-md px-1 py-1.5 text-sm">
    <dt className="w-32 shrink-0 text-text-muted">{name}</dt>
    <dd className="min-w-0 break-words font-medium text-text">{children}</dd>
  </div>
);

Row.displayName = 'Row';

/**
 * Everything the server knows about one session's stream, shown to an administrator rather than to
 * the viewer: what the file is, what the session is doing to it, how the machine is coping with it,
 * and how much the viewer has buffered. The answer to "why does this one look bad".
 *
 * @param session - The session being examined.
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 */
const SessionStatsDialog = ({ session, isOpen, onClose }: SessionStatsDialogProps) => {
  const { playback } = session;

  return (
    <DialogCompanion label={say('common.streamStats')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle size="compact" title={say('common.streamStats')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent>
        <dl className="flex flex-col divide-y divide-[var(--surface-line)]">
          <Row name="Viewer">{nameOfSession(session)}</Row>
          <Row name="Device">{session.deviceLabel}</Row>

          {playback === null ? (
            <Row name="Watching">{say('screens.adminArea.sessionStatsDialog.nothingRightNow')}</Row>
          ) : (
            <>
              <Row name="Title">{playback.mediaTitle}</Row>
              <Row name="Delivery">{describeSessionDelivery(playback).detail}</Row>
              <Row name="Reused">{describeTranscodeReuse(playback.reuse)}</Row>
              <Row name="Status">
                {playback.isPlaying
                  ? say('common.playing')
                  : playback.pausedByAdmin
                    ? say('screens.adminArea.sessionStatsDialog.pausedByAnAdmin')
                    : say('common.paused')}
              </Row>
              <Row name="Started">{new Date(playback.startedAt).toLocaleTimeString()}</Row>

              <Row name="Container">
                {describeAxis(
                  playback.plan.container.kind,
                  sayAgain(playback.plan.container.reason.detail),
                )}
              </Row>
              <Row name="Video">{describeVideoAxis(playback.plan.video)}</Row>
              <Row name="Audio">{describeAudioAxis(playback.plan.audio)}</Row>
              <Row name="Subtitles">
                {describeAxis(
                  playback.plan.subtitles.kind,
                  sayAgain(playback.plan.subtitles.reason.detail),
                )}
              </Row>

              {playback.health === null ? (
                <Row name="Buffer">
                  {say('screens.adminArea.sessionStatsDialog.notReportedYet')}
                </Row>
              ) : (
                <>
                  <Row name="Buffer">
                    {say('screens.adminArea.sessionStatsDialog.bufferedAheadSecondsSAhead', {
                      bufferedAheadSeconds: playback.health.bufferedAheadSeconds.toFixed(1),
                    })}
                  </Row>
                  <Row name="Picture size">
                    {playback.health.presentedWidth === 0
                      ? say('screens.adminArea.sessionStatsDialog.nothingDecodedYet')
                      : `${playback.health.presentedWidth.toString()}x${playback.health.presentedHeight.toString()}`}
                  </Row>
                </>
              )}
            </>
          )}
        </dl>
      </DialogContent>
    </DialogCompanion>
  );
};

SessionStatsDialog.displayName = 'SessionStatsDialog';

export { SessionStatsDialog };
