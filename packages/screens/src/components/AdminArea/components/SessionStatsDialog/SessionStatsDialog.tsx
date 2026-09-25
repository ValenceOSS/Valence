import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react';
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
import { say } from '@ValenceI18n/say';
import type { SessionStatsDialogProps } from './SessionStatsDialog.types';

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
    <DialogCompanion
      label={say('admin.sessionStatsDialog.title')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle size="compact" title={say('admin.sessionStatsDialog.title')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent>
        <dl className="flex flex-col divide-y divide-[var(--surface-line)]">
          <Row name={say('admin.sessionStatsDialog.viewer')}>{nameOfSession(session)}</Row>
          <Row name={say('admin.sessionStatsDialog.device')}>{session.deviceLabel}</Row>

          {playback === null ? (
            <Row name={say('admin.sessionStatsDialog.watching')}>
              {say('admin.sessionStatsDialog.nothingRightNow')}
            </Row>
          ) : (
            <>
              <Row name={say('admin.sessionStatsDialog.titleRow')}>{playback.mediaTitle}</Row>
              <Row name={say('admin.sessionStatsDialog.delivery')}>
                {describeSessionDelivery(playback).detail}
              </Row>
              <Row name={say('admin.sessionStatsDialog.reused')}>
                {describeTranscodeReuse(playback.reuse)}
              </Row>
              <Row name={say('admin.sessionStatsDialog.status')}>
                {playback.isPlaying
                  ? say('admin.sessionStatsDialog.playing')
                  : playback.pausedByAdmin
                    ? say('admin.sessionStatsDialog.pausedByAdmin')
                    : say('admin.sessionStatsDialog.paused')}
              </Row>
              <Row name={say('admin.sessionStatsDialog.started')}>
                {new Date(playback.startedAt).toLocaleTimeString()}
              </Row>

              <Row name={say('admin.sessionStatsDialog.container')}>
                {describeAxis(playback.plan.container.kind, playback.plan.container.reason.detail)}
              </Row>
              <Row name={say('admin.sessionStatsDialog.video')}>
                {describeVideoAxis(playback.plan.video)}
              </Row>
              <Row name={say('admin.sessionStatsDialog.audio')}>
                {describeAudioAxis(playback.plan.audio)}
              </Row>
              <Row name={say('admin.sessionStatsDialog.subtitles')}>
                {describeAxis(playback.plan.subtitles.kind, playback.plan.subtitles.reason.detail)}
              </Row>

              {playback.health === null ? (
                <Row name={say('admin.sessionStatsDialog.buffer')}>
                  {say('admin.sessionStatsDialog.notReported')}
                </Row>
              ) : (
                <>
                  <Row name={say('admin.sessionStatsDialog.buffer')}>
                    {say('admin.sessionStatsDialog.ahead', {
                      seconds: playback.health.bufferedAheadSeconds.toFixed(1),
                    })}
                  </Row>
                  <Row name={say('admin.sessionStatsDialog.pictureSize')}>
                    {playback.health.presentedWidth === 0
                      ? say('admin.sessionStatsDialog.nothingDecoded')
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
