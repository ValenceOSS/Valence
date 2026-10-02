import { useEffect, useRef } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { SplashScreen } from '@ValenceUI/SplashScreen';
import { VideoPlayer } from '@ValenceScreens/components/VideoPlayer/VideoPlayer';
import { PartyMenu } from '@ValenceScreens/components/PartyMenu/PartyMenu';
import { PartyPasswordDialog } from '@ValenceScreens/components/PartyPasswordDialog/PartyPasswordDialog';
import { useWhereToBegin } from '@ValenceClient/party/useWhereToBegin';
import { usePartyPlayback } from '@ValenceClient/party/usePartyPlayback';
import { invitationTo } from '@ValenceClient/party/invitationTo';
import { countCarriedOn } from '@ValenceClient/playback/countCarriedOn';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import { useSeasonMates } from '@ValenceScreens/library/useSeasonMates';
import { watchedFraction, FINISHED_WITHIN_SECONDS } from '@ValenceContracts/schemas/WatchProgress';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { HOME } from '@ValenceClient/navigation/readLocation';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useShell } from '@ValenceClient/shell/useShell';
import { useQuietMusic } from '@ValenceScreens/music/useQuietMusic';
import { say } from '@ValenceI18n/say';

const PROGRESS_EVERY_SECONDS = 5;

/**
 * The player, filling the screen, and the watch party that may be watching along with it.
 */
const WatchPage = () => {
  useQuietMusic();

  const {
    title,
    known,
    progress,
    isProgressReady,
    reportProgress,
    readProgress,
    startOverride,
    watchParty,
    household,
    watcher,
    setAskingAbout,
  } = useShell();

  const { place, go } = usePlace();
  const filmParty = watchParty.party?.kind === 'watch' ? watchParty.party : null;
  const prefersReducedMotion = useReducedMotionConfig();

  const markedAtRef = useRef(0);
  const carriedOnRef = useRef(0);
  const carriedOnToRef = useRef<string | null>(null);

  const playing = place.playing === null ? null : (known.get(place.playing) ?? null);
  const seasonMates = useSeasonMates(playing, [...known.values()]);
  const season =
    playing === null || playing.seriesTitle === null || playing.seriesTitle === undefined
      ? []
      : [playing, ...seasonMates].sort(
          (left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0),
        );

  useEffect(() => {
    markedAtRef.current = 0;

    void readProgress();
  }, [place.playing, readProgress]);

  useEffect(() => {
    carriedOnRef.current = countCarriedOn({
      nowPlaying: place.playing,
      carriedOnTo: carriedOnToRef.current,
      carriedOn: carriedOnRef.current,
    });
  }, [place.playing]);

  const partyPlayback = usePartyPlayback(watchParty, playing?.id ?? null);
  const found = playing === null ? undefined : progress.get(playing.id);
  const startAt =
    playing !== null && startOverride?.mediaId === playing.id
      ? startOverride.seconds
      : found === undefined || found.isFinished
        ? 0
        : Math.floor(found.positionSeconds);
  const beginning = useWhereToBegin({
    watchParty,
    invitedTo: place.party,
    mediaId: playing?.id ?? null,
    resumeSeconds: startAt,
    isReady: isProgressReady || (playing !== null && startOverride?.mediaId === playing.id),
  });

  if (playing === null) {
    return <SplashScreen name={title} label={say('common.loadingTitle', { title })} />;
  }

  if (!isProgressReady && startOverride?.mediaId !== playing.id) {
    return <SplashScreen name={title} label={say('common.loadingTitle', { title })} />;
  }

  if (beginning.kind === 'wait') {
    return <SplashScreen name={title} label={say('common.joiningTheWatchParty')} />;
  }

  return (
    <motion.main
      initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion === true ? 0.15 : 0.45, ease: [0.2, 0, 0, 1] }}
      className="valence-below-the-bar z-40 flex flex-col bg-shade"
    >
      <VideoPlayer
        media={playing}
        startSeconds={beginning.atSeconds}
        partyNotice={watchParty.notice}
        isImmersive
        onStopped={() => {
          go(HOME);
        }}
        renderPartyMenu={({ isHidden, onOpenChange }) => (
          <PartyMenu
            party={filmParty}
            durationSeconds={playing.durationSeconds}
            meConnectionId={watchParty.meConnectionId}
            waitingFor={watchParty.waitingFor}
            isHidden={isHidden}
            onOpenChange={onOpenChange}
            onOpen={() => {
              watchParty.open(playing.id);
            }}
            onSetRole={watchParty.setRole}
            onLoosen={watchParty.loosen}
            onRemove={watchParty.remove}
            onSetPassword={watchParty.setPassword}
            people={household}
            onAsk={watchParty.ask}
            onLeave={() => {
              watchParty.leave();
              go({ party: null });
            }}
            {...(filmParty === null
              ? {}
              : {
                  invitation: invitationTo(filmParty.id, filmParty.mediaId, window.location.origin),
                })}
            onCopyInvitation={async (invitation) => {
              await navigator.clipboard.writeText(invitation);
            }}
          />
        )}
        {...(partyPlayback === null ? {} : { party: partyPlayback })}
        episodes={season}
        onSelectEpisode={(episode) => {
          go({ playing: episode.id });
        }}
        watchedFractionFor={(mediaId) => {
          const held = progress.get(mediaId);

          return held === undefined ? undefined : watchedFraction(held);
        }}
        onProgress={(positionSeconds, durationSeconds) => {
          const whole = Math.floor(positionSeconds);

          if (Math.abs(whole - markedAtRef.current) < PROGRESS_EVERY_SECONDS) {
            return;
          }

          markedAtRef.current = whole;

          reportProgress({
            mediaId: playing.id,
            positionSeconds,
            durationSeconds,
            isFinished: positionSeconds >= durationSeconds - FINISHED_WITHIN_SECONDS,
            updatedAt: new Date().toISOString(),
          });
        }}
        onEnded={() => {
          const decided = decideWhatFollows({
            following: nextEpisode(season, playing),
            carriedOn: carriedOnRef.current,
            askAfter: watcher?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
          });

          if (decided.kind === 'nothing') {
            go({ playing: null, inspecting: playing.id });

            return;
          }

          if (decided.kind === 'ask') {
            setAskingAbout(decided.episode);

            return;
          }

          carriedOnRef.current += 1;
          carriedOnToRef.current = decided.episode.id;
          go({ playing: decided.episode.id, inspecting: null });
        }}
        onClose={() => {
          if (filmParty !== null) {
            watchParty.leave();
          }

          go({ playing: null, party: null, inspecting: playing.id });
          void readProgress();
        }}
      />

      <PartyPasswordDialog
        isOpen={watchParty.passwordWanted !== null}
        wasWrong={watchParty.passwordWanted?.wasWrong ?? false}
        onJoin={(password) => {
          watchParty.join(watchParty.passwordWanted?.partyId ?? '', password);
        }}
        onClose={() => {
          watchParty.stopAsking();
          go({ party: null });
        }}
      />
    </motion.main>
  );
};

WatchPage.displayName = 'WatchPage';

export { WatchPage };
