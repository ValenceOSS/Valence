import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { SplashScreen } from '@ValenceUI/SplashScreen';
import { VideoPlayer } from '@ValenceScreens/components/VideoPlayer/VideoPlayer';
import { PreRoll } from '@ValenceScreens/components/PreRoll/PreRoll';
import { usePreRoll } from '@ValenceClient/playback/usePreRoll';
import { PartyMenu } from '@ValenceScreens/components/PartyMenu/PartyMenu';
import { PartyPasswordDialog } from '@ValenceScreens/components/PartyPasswordDialog/PartyPasswordDialog';
import { useWhereToBegin } from '@ValenceClient/party/useWhereToBegin';
import { usePartyPlayback } from '@ValenceClient/party/usePartyPlayback';
import { invitationTo } from '@ValenceClient/party/invitationTo';
import { countCarriedOn } from '@ValenceClient/playback/countCarriedOn';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import { useSeasonMates } from '@ValenceScreens/library/useSeasonMates';
import { useShowEpisodes } from '@ValenceScreens/library/useShowEpisodes';
import { watchedFraction, FINISHED_WITHIN_SECONDS } from '@ValenceContracts/schemas/WatchProgress';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { HOME } from '@ValenceClient/navigation/readLocation';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useShell } from '@ValenceClient/shell/useShell';
import { useQuietMusic } from '@ValenceScreens/music/useQuietMusic';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

const PROGRESS_EVERY_SECONDS = 5;

/**
 * The player, filling the screen, and the watch party that may be watching along with it. Moving
 * on to another title once something has played keeps the player in place, on the title before
 * until the next is known, so a player in fullscreen stays in fullscreen rather than being swapped
 * for the loading screen. The first title still waits for where to begin. A pre-roll clip plays
 * first where the server has one, before the title it was opened on, from the beginning and
 * outside a watch party.
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
  const [carriedOn, setCarriedOn] = useState(0);
  const carriedOnToRef = useRef<string | null>(null);

  const playing = place.playing === null ? null : (known.get(place.playing) ?? null);
  const [openedOn] = useState(place.playing);
  const [lastShown, setLastShown] = useState<MediaSummary | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const seasonMates = useSeasonMates(playing, [...known.values()]);
  const showEpisodes = useShowEpisodes(playing, [...known.values()]);
  const season =
    playing === null || playing.seriesTitle === null || playing.seriesTitle === undefined
      ? []
      : [playing, ...seasonMates].sort(
          (left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0),
        );

  useEffect(() => {
    if (playing !== null) {
      setLastShown(playing);
    }
  }, [playing]);

  useEffect(() => {
    markedAtRef.current = 0;

    void readProgress();
  }, [place.playing, readProgress]);

  useEffect(() => {
    setCarriedOn((was) =>
      countCarriedOn({
        nowPlaying: place.playing,
        carriedOnTo: carriedOnToRef.current,
        carriedOn: was,
      }),
    );
  }, [place.playing]);

  const following = playing === null ? null : nextEpisode(showEpisodes, playing);
  const decided = decideWhatFollows({
    following,
    carriedOn,
    askAfter: watcher?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
  });

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

  const isCarryingOn =
    hasPlayed && lastShown !== null && place.playing !== null && place.party === null;
  const shown = playing ?? (isCarryingOn ? lastShown : null);
  const isWaiting =
    shown === null ||
    (!isCarryingOn && !isProgressReady && startOverride?.mediaId !== shown.id) ||
    (!isCarryingOn && beginning.kind === 'wait');

  useEffect(() => {
    if (!isWaiting) {
      setHasPlayed(true);
    }
  }, [isWaiting]);

  const preRoll = usePreRoll(
    playing?.id ?? null,
    playing !== null &&
      !isCarryingOn &&
      playing.id === openedOn &&
      beginning.kind !== 'wait' &&
      beginning.atSeconds === 0 &&
      filmParty === null &&
      place.party === null,
  );

  if (shown === null) {
    return <SplashScreen name={title} label={say('common.loadingTitle', { title })} />;
  }

  if (!isCarryingOn && !isProgressReady && startOverride?.mediaId !== shown.id) {
    return <SplashScreen name={title} label={say('common.loadingTitle', { title })} />;
  }

  if (!isCarryingOn && beginning.kind === 'wait') {
    return <SplashScreen name={title} label={say('common.joiningTheWatchParty')} />;
  }

  if (preRoll.kind === 'asking') {
    return <SplashScreen name={title} label={say('common.loadingTitle', { title })} />;
  }

  if (preRoll.kind === 'clip') {
    return (
      <main className="valence-below-the-bar z-40 flex flex-col bg-shade">
        <PreRoll
          address={preRoll.address}
          label={say('common.loadingTitle', { title: shown.title })}
          onDone={preRoll.onDone}
        />
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, scale: prefersReducedMotion === true ? 1 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion === true ? 0.15 : 0.45, ease: [0.2, 0, 0, 1] }}
      className="valence-below-the-bar z-40 flex flex-col bg-shade"
    >
      <VideoPlayer
        media={shown}
        startSeconds={beginning.kind === 'wait' ? 0 : beginning.atSeconds}
        partyNotice={watchParty.notice}
        isImmersive
        onStopped={() => {
          go(HOME);
        }}
        renderPartyMenu={({ isHidden, onOpenChange }) => (
          <PartyMenu
            party={filmParty}
            durationSeconds={shown.durationSeconds}
            meConnectionId={watchParty.meConnectionId}
            waitingFor={watchParty.waitingFor}
            isHidden={isHidden}
            onOpenChange={onOpenChange}
            onOpen={() => {
              watchParty.open(shown.id);
            }}
            onSetRole={watchParty.setRole}
            onLoosen={watchParty.loosen}
            chat={watchParty.chat}
            onWrite={watchParty.write}
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
        following={following}
        onSelectEpisode={(episode) => {
          go({ playing: episode.id });
        }}
        willCarryOn={decided.kind === 'play'}
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
            mediaId: shown.id,
            positionSeconds,
            durationSeconds,
            isFinished: positionSeconds >= durationSeconds - FINISHED_WITHIN_SECONDS,
            updatedAt: new Date().toISOString(),
          });
        }}
        onEnded={() => {
          if (decided.kind === 'nothing') {
            go({ playing: null, inspecting: shown.id });

            return;
          }

          if (decided.kind === 'ask') {
            setAskingAbout(decided.episode);

            return;
          }

          setCarriedOn(carriedOn + 1);
          carriedOnToRef.current = decided.episode.id;
          go({ playing: decided.episode.id, inspecting: null });
        }}
        onClose={() => {
          if (filmParty !== null) {
            watchParty.leave();
          }

          go({ playing: null, party: null, inspecting: shown.id });
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
