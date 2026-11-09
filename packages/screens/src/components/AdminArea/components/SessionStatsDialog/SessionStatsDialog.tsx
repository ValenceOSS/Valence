import { X as XIcon } from '@keyline-icons/react/fill';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { Icon } from '@ValenceUI/Icon';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Button } from '@ValenceUI/Button';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import { namesOfSession } from '@ValenceScreens/devices/namesOfSession';
import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { describeSessionHardware } from '@ValenceScreens/admin/describeSessionHardware';
import { nameOfSession } from '@ValenceScreens/admin/nameOfSession';
import { titleOfSession } from '@ValenceScreens/admin/titleOfSession';
import { episodeOfSession } from '@ValenceScreens/admin/episodeOfSession';
import { describeSize } from '@ValenceScreens/playback/describeSize';
import { StatsSummary } from '@ValenceScreens/components/StatsSummary/StatsSummary';
import { StatsCard } from '@ValenceScreens/components/StatsCard/StatsCard';
import { StatsFact } from '@ValenceScreens/components/StatsFact/StatsFact';
import { StatsSeconds } from '@ValenceScreens/components/StatsSeconds/StatsSeconds';
import { PlanAxis } from '@ValenceScreens/components/PlanAxis/PlanAxis';
import type { SessionStatsDialogProps } from './SessionStatsDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Everything the server knows about one session's stream, laid out as the player's own stats for
 * nerds are: the figures that matter at a glance, then who is watching on what, what the session is
 * doing to the file and why, and how the viewer's player is keeping up. Shown to an administrator
 * rather than the viewer, as the answer to "why does this one look bad".
 *
 * @param session - The session being examined.
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 */
const SessionStatsDialog = ({ session, isOpen, onClose }: SessionStatsDialogProps) => {
  const { playback } = session;
  const names = namesOfSession(session);
  const health = playback?.health ?? null;
  const plan = playback?.plan ?? null;
  const episode = episodeOfSession(session);
  const drawn =
    health === null || health.presentedWidth === 0
      ? null
      : describeSize(health.presentedWidth, health.presentedHeight);
  const status =
    playback === null
      ? null
      : playback.isPlaying
        ? say('common.playing')
        : playback.pausedByAdmin
          ? say('screens.adminArea.sessionStatsDialog.pausedByAnAdmin')
          : say('common.paused');

  return (
    <DialogCompanion label={say('common.streamStats')} isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={say('common.streamStats')}
        detail={
          playback === null
            ? say('screens.adminArea.sessionStatsDialog.nothingRightNow')
            : [titleOfSession(session), episode].filter((part) => part !== null).join(' · ')
        }
      >
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent>
        <div className="flex flex-col gap-2 text-xs">
          {playback === null ? null : (
            <StatsSummary
              items={[
                { label: say('common.mode'), value: describeSessionDelivery(playback).label },
                { label: say('common.picture'), value: drawn },
                { label: say('common.status'), value: status },
                {
                  label: say('common.position'),
                  value: health === null ? null : formatDuration(health.positionSeconds),
                },
                {
                  label: say('tv.player.streamStats.bufferedAhead'),
                  value:
                    health === null ? null : <StatsSeconds value={health.bufferedAheadSeconds} />,
                },
                {
                  label: say('screens.observabilityPage.jobTraceDialog.started'),
                  value: new Date(playback.startedAt).toLocaleTimeString(),
                },
              ]}
            />
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <StatsCard name="Viewer">
              <StatsFact name="Viewer" value={nameOfSession(session)} />
              <StatsFact name={say('common.device')} value={names.device} />
              <StatsFact name={say('common.browserOrApp')} value={names.client} />
              <StatsFact name="User agent" value={session.userAgent} isCode />
            </StatsCard>

            <StatsCard name="Session">
              <StatsFact
                name="Delivery"
                value={playback === null ? null : describeSessionDelivery(playback).detail}
              />
              <StatsFact
                name={say('screens.adminArea.sessionStatsDialog.graphicsDevice')}
                value={
                  playback?.hardware === null || playback?.hardware === undefined
                    ? null
                    : describeSessionHardware(playback.hardware)
                }
              />
              <StatsFact
                name="Reused"
                value={playback === null ? null : describeTranscodeReuse(playback.reuse)}
              />
            </StatsCard>
          </div>

          {plan === null ? null : (
            <StatsCard name="Plan">
              <PlanAxis
                name="Container"
                kind={plan.container.kind}
                reason={sayAgain(plan.container.reason.detail)}
              />
              <PlanAxis
                name="Video"
                kind={plan.video.kind}
                reason={sayAgain(plan.video.reason.detail)}
                ceiling={
                  plan.video.kind === 'passthrough'
                    ? null
                    : say('screens.videoPlayer.streamStats.widthByHeightAtKbps', {
                        width: plan.video.maxWidth.toString(),
                        height: plan.video.maxHeight.toString(),
                        kbps: plan.video.maxBitrateKbps.toString(),
                      })
                }
              />
              <PlanAxis
                name="Audio"
                kind={plan.audio.kind}
                reason={sayAgain(plan.audio.reason.detail)}
                ceiling={
                  plan.audio.kind === 'passthrough'
                    ? null
                    : say('common.valueKbps', { value: plan.audio.maxBitrateKbps.toString() })
                }
              />
              <PlanAxis
                name="Subtitles"
                kind={plan.subtitles.kind}
                reason={sayAgain(plan.subtitles.reason.detail)}
              />
            </StatsCard>
          )}

          {playback === null ? null : (
            <StatsCard name="Playback">
              <StatsFact
                name="Position"
                value={
                  health === null
                    ? say('screens.adminArea.sessionStatsDialog.notReportedYet')
                    : `${formatDuration(health.positionSeconds)} / ${formatDuration(health.durationSeconds)}`
                }
              />
              <StatsFact
                name="Buffered ahead"
                value={
                  health === null ? null : <StatsSeconds value={health.bufferedAheadSeconds} />
                }
              />
              <StatsFact
                name="Drawn at"
                value={
                  health === null
                    ? null
                    : (drawn ?? say('screens.adminArea.sessionStatsDialog.nothingDecodedYet'))
                }
              />
              <StatsFact name="Media" value={playback.mediaId} isCode />
              <StatsFact name="Client" value={session.clientId} isCode />
            </StatsCard>
          )}
        </div>
      </DialogContent>
    </DialogCompanion>
  );
};

SessionStatsDialog.displayName = 'SessionStatsDialog';

export { SessionStatsDialog };
