import { useState } from 'react';
import { TruncatedText } from '@ValenceUI/TruncatedText';
import {
  Info as InfoIcon,
  LogOut as LogOutFilledIcon,
  MessageSquare as MessageSquareIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
  Stop as StopIcon,
} from '@keyline-icons/react/fill';
import { Cast as CastIcon } from '@keyline-icons/react';
import { describeStreamLimit } from '@ValenceClient/admin/describeStreamLimit';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { namesOfSession } from '@ValenceScreens/devices/namesOfSession';
import { DeviceLabel } from '@ValenceScreens/components/DeviceLabel/DeviceLabel';
import { SessionStatsDialog } from '@ValenceScreens/components/AdminArea/components/SessionStatsDialog/SessionStatsDialog';
import { SessionArtwork } from '@ValenceScreens/components/AdminArea/components/SessionCard/components/SessionArtwork/SessionArtwork';
import { SessionTime } from '@ValenceScreens/components/AdminArea/components/SessionCard/components/SessionTime/SessionTime';
import type { SessionCardProps } from './SessionCard.types';
import { say } from '@ValenceI18n/say';

const ACTION = 'size-8 text-text-muted hover:text-text';

const DANGER = 'size-8 text-danger hover:bg-danger/12 hover:text-danger';

/**
 * One open session as a card: what it is playing over its own artwork, how far through it is and on
 * what device, and the controls for intervening in it — pausing or carrying on, a message, the
 * stream's stats, stopping it and signing the device out. The card measures itself, so the artwork
 * scales with whatever size the cards are drawn at.
 *
 * @param session - The session.
 * @param isBusy - Whether an instruction for it is in flight.
 * @param onStop - Called to stop it.
 * @param onPause - Called to pause it.
 * @param onResume - Called to let it carry on.
 * @param onMessage - Called to tell the viewer something, without touching their playback.
 * @param onSignOut - Called to sign the device out, where that is allowed.
 */
const SessionCard = ({
  session,
  isBusy,
  onStop,
  onPause,
  onResume,
  onMessage,
  onSignOut,
}: SessionCardProps) => {
  const { playback, listening, bookListening } = session;
  const heard = listening ?? bookListening;
  const isActive = playback !== null || heard !== null;
  const isPlaying = playback?.isPlaying ?? heard?.isPlaying ?? false;
  const isThisDevice = session.clientId === platformInUse().thisClientId();
  const limited = describeStreamLimit(session.streams);
  const [isShowingStats, setIsShowingStats] = useState(false);

  return (
    <article className="@container flex min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--surface-line)]">
      <SessionArtwork session={session} />

      <div className="flex min-w-0 flex-col gap-0.5 px-3.5 pb-3 pt-[0.6875rem]">
        <SessionTime session={session} />

        <span className="flex min-w-0 text-[0.78125rem]">
          <DeviceLabel
            {...namesOfSession(session)}
            identity={session.identity}
            clientKind={session.clientKind}
            userAgent={session.userAgent}
          />
        </span>

        {session.remoteFor === null && session.controlledFrom === null ? null : (
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
            <Icon of={CastIcon} size={13} className="shrink-0" />
            <TruncatedText
              text={
                session.remoteFor === null
                  ? say('screens.adminArea.sessionCard.controlledFromLabel', {
                      label: session.controlledFrom?.label ?? '',
                    })
                  : say('screens.videoRemote.remoteForLabel', { label: session.remoteFor.label })
              }
            />
          </span>
        )}

        {limited === null ? null : (
          <TruncatedText text={limited} className="text-xs text-text-muted" />
        )}
      </div>

      {isThisDevice ? (
        <div className="mt-auto flex items-center border-t border-[var(--surface-line)] px-3 py-1.5">
          <span className="flex h-8 items-center">
            <Badge size="sm" tone="accent">
              {say('common.thisDevice')}
            </Badge>
          </span>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-0.5 border-t border-[var(--surface-line)] px-2 py-1.5">
          {!isActive || isPlaying ? (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={
                isActive
                  ? say('common.pause')
                  : say('screens.adminArea.sessionCard.nothingIsPlayingToPause')
              }
              disabled={isBusy || !isActive}
              onClick={onPause}
              className={ACTION}
            >
              <Icon of={PauseFilledIcon} size={16} />
            </Button>
          ) : (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={say('common.play')}
              disabled={isBusy}
              onClick={onResume}
              className={ACTION}
            >
              <Icon of={PlayFilledIcon} size={16} />
            </Button>
          )}

          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={
              session.clientKind === 'tv'
                ? say('screens.adminArea.sessionCard.theTvAppCannotShowMessages')
                : playback === null
                  ? say('screens.adminArea.sessionCard.messagesShowOnlyWhileWatching')
                  : say('screens.adminArea.sessionCard.message')
            }
            disabled={isBusy || session.clientKind === 'tv' || playback === null}
            onClick={onMessage}
            className={ACTION}
          >
            <Icon of={MessageSquareIcon} size={16} />
          </Button>

          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            label={
              playback === null
                ? say('screens.adminArea.sessionCard.streamStatsShowOnlyForVideos')
                : say('common.streamStats')
            }
            disabled={playback === null}
            onClick={() => {
              setIsShowingStats(true);
            }}
            className={ACTION}
          >
            <Icon of={InfoIcon} size={16} />
          </Button>

          <span className="ml-auto flex items-center gap-0.5">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={
                isActive
                  ? say('common.stop')
                  : say('screens.adminArea.sessionCard.nothingIsPlayingToStop')
              }
              disabled={isBusy || !isActive}
              onClick={onStop}
              className={DANGER}
            >
              <Icon of={StopIcon} size={16} />
            </Button>

            {onSignOut === undefined || session.accountId === null ? null : (
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                label={say('common.signThisOut')}
                disabled={isBusy}
                onClick={onSignOut}
                className={DANGER}
              >
                <Icon of={LogOutFilledIcon} size={16} />
              </Button>
            )}
          </span>
        </div>
      )}

      <SessionStatsDialog
        session={session}
        isOpen={isShowingStats}
        onClose={() => {
          setIsShowingStats(false);
        }}
      />
    </article>
  );
};

SessionCard.displayName = 'SessionCard';

export { SessionCard };
