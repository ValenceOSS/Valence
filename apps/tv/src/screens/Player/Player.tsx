import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useTVEventHandler, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { moveTheVideoTo } from '@ValenceTv/playback/moveTheVideoTo';
import { playTheVideoAt } from '@ValenceTv/playback/playTheVideoAt';
import { SkipForward } from '@keyline-icons/react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { describeSkip, skippableAt } from '@ValenceClient/playback/fetchSegments';
import { qualityStepCostsFor } from '@ValenceClient/playback/qualityStepCostsFor';
import { qualityStepDetail } from '@ValenceClient/playback/qualityStepDetail';
import { stepsThatSaveNothing } from '@ValenceClient/playback/stepsThatSaveNothing';
import { defaultTrackId, SUBTITLES_OFF } from '@ValenceClient/playback/fetchSubtitles';
import {
  REPORT_EVERY_MILLISECONDS,
  reportWatchProgress,
} from '@ValenceClient/playback/watchProgress';
import {
  QualityPreferenceSchema,
  readQualityPreference,
  saveQualityPreference,
} from '@ValenceClient/playback/qualityPreference';
import { describeAudioTrack } from '@ValenceCore/functions/describeTrack';
import { originalLabel } from '@ValenceCore/functions/originalLabel';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { FINISHED_WITHIN_SECONDS } from '@ValenceContracts/schemas/WatchProgress';
import { Button } from '@ValenceTv/components/Button/Button';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { useRemoteRing } from '@ValenceTv/remote/useRemoteRing';
import { usePlaybackSession } from '@ValenceTv/playback/usePlaybackSession';
import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';
import { useRemoteControlled } from '@ValenceTv/playback/useRemoteControlled';
import { PlayerControls } from '@ValenceTv/screens/Player/components/PlayerControls/PlayerControls';
import { SubtitleLine } from '@ValenceTv/screens/Player/components/SubtitleLine/SubtitleLine';
import { SettingsMenu } from '@ValenceTv/screens/Player/components/SettingsMenu/SettingsMenu';
import { StreamStats } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats';
import { TrackMenu } from '@ValenceTv/screens/Player/components/TrackMenu/TrackMenu';
import { UpNext } from '@ValenceTv/screens/Player/components/UpNext/UpNext';
import { PartyPanel } from '@ValenceTv/components/PartyPanel/PartyPanel';
import { roomPlayerOfExpo } from '@ValenceNative/party/roomPlayerOfExpo';
import { useFollowTheRoom } from '@ValenceClient/party/useFollowTheRoom';
import { usePartyPlayback } from '@ValenceClient/party/usePartyPlayback';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { sayCount } from '@ValenceI18n/sayCount';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HWEvent } from 'react-native';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { StreamReading } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats.types';
import type { PlayerProps } from './Player.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { placeOfEpisode } from '@ValenceTv/library/placeOfEpisode';
import { captionChoices } from '@ValenceClient/playback/captionChoices';
import type { CaptionChoiceSet } from '@ValenceClient/playback/captionChoices';
import { useCaptionStyle } from '@ValenceClient/playback/useCaptionStyle';
import { SUBTITLE_NUDGES } from '@ValenceClient/playback/SUBTITLE_NUDGES';
import { describeSubtitleOffset } from '@ValenceClient/playback/describeSubtitleOffset';
import { say } from '@ValenceI18n/say';

const HIDES_AFTER_MS = 5000;

const SKIPS_BY = 10;

const SCRUBS_BY = 10;

const HELD_STEPS_EVERY_MS = 100;

const HELD_SPEEDS_UP_BY = 0.35;

const HELD_STEPS_AT_MOST = 90;

const A_TURN_SCRUBS = 60;

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const STATS_READ_EVERY_MS = 1000;

const NOTHING_READ: StreamReading = {
  positionSeconds: 0,
  bufferedSeconds: 0,
  width: null,
  height: null,
  mimeType: null,
  bitrate: null,
  frameRate: null,
  range: null,
};

const UP_NEXT_BEFORE_END = 30;

const REFUSED_SIGN_IN = '-1013';

const SAID_FOR_MS = 4000;

/**
 * Nothing, for a player that cannot refuse to start the way a browser can.
 */
const NEVER_REFUSES = () => undefined;

/**
 * How a playing speed is said: normal at its own pace, and otherwise as a multiple.
 *
 * @param speed - How fast it plays, where one is its own pace.
 * @returns Its name.
 */
const speedLabelOf = (speed: number): string =>
  speed === 1 ? say('common.normal') : `${speed.toString()}×`;

/**
 * What the settings say for a quality: the original as it is, or the step's own name.
 *
 * @param quality - The quality asked for.
 * @returns Its name.
 */
const qualityLabelOf = (quality: QualityPreference): string =>
  quality === 'original'
    ? say('common.original')
    : (QUALITY_STEPS.find((step) => step.id === quality)?.label ?? quality);

/**
 * What to tell somebody when the player could not open what the server sent.
 *
 * The commonest reason is the server turning the player away, which it does once the television's
 * sign-in has run out.
 *
 * @param message - What the player said went wrong.
 * @returns What to show.
 */
const whyItWillNotPlay = (message: string): string =>
  message.includes(REFUSED_SIGN_IN)
    ? say('tv.player.thisValenceTurnedTheTelevisionAway')
    : say('tv.player.thisCouldNotBePlayedMessage', { message });

/**
 * Plays a title across the whole screen, with Valence's own controls over it rather than the
 * system's, so that what only Valence knows about can sit beside pause and play: skipping an intro
 * or the credits, choosing subtitles and sound, and moving on to the next episode.
 *
 * The remote works as it does in the television's own player. Play/Pause always pauses or plays;
 * with the controls away, left and right go back and forward ten seconds and any other press brings
 * them up; they go away again after a few seconds of playing untouched, and Menu puts them away
 * before it leaves. The player holds Menu itself for as long as it is open, so leaving a film goes
 * back rather than out of the app, whatever is beneath it. As an episode's credits roll the next one is offered, and starts on its own after
 * a count unless enough have followed on untouched that it asks instead.
 *
 * Where this viewer is gets reported as they go and once more on leaving, so every screen with this
 * title on it knows where they stopped. The position is kept from the player's own events rather
 * than asked of it, since the last report is made as the screen closes, after the player itself has
 * been let go. Choosing another sound track starts a new session from where the player was, since
 * the server converts the sound it was asked for.
 *
 * @param mediaId - What to play.
 * @param startSeconds - Where to start.
 * @param carriedOn - How many episodes have followed on their own before this one.
 * @param onLeave - Told when the title ends with nothing after it, or somebody gives up on it.
 * @param onNext - Told to play the next episode, and how many will then have followed on untouched.
 * @param watchParty - The watch party this television holds. Where it is watching this, the film is
 * kept in step with the room — Play/Pause, skipping and scrubbing go to the room rather than straight
 * to the player, and what the others did is said over the picture — and the party is reached from
 * the settings, to start one, see who is in it, or leave. A party wanting its password asks for it
 * over the film.
 */
const Player = ({ mediaId, startSeconds, carriedOn, onLeave, onNext, watchParty }: PlayerProps) => {
  const cache = useQueryClient();
  const detail = useQuery(libraryQueries.detail(mediaId));
  const watching = useQuery(profileQueries.watching());
  const segments = useQuery(playbackQueries.segments(mediaId));
  const tracks = useQuery(playbackQueries.subtitleTracks(mediaId));

  const summary = useMemo(
    () => (detail.data === undefined || detail.data === null ? null : summariseDetail(detail.data)),
    [detail.data],
  );
  const showId = summary === null ? null : showIdOf(summary);
  const stepCosts = useMemo(
    () =>
      detail.data === undefined || detail.data === null
        ? {}
        : qualityStepCostsFor({ media: detail.data, profile: theTvsProfile() }),
    [detail.data],
  );
  const stepsSavingNothing = useMemo(
    () =>
      detail.data === undefined || detail.data === null
        ? []
        : stepsThatSaveNothing({ media: detail.data, profile: theTvsProfile() }),
    [detail.data],
  );
  const show = useQuery({
    ...libraryQueries.show(detail.data?.libraryId ?? null, showId),
    enabled: showId !== null && detail.data !== undefined && detail.data !== null,
  });

  const episodes = useMemo(
    () =>
      show.data === undefined || show.data === null
        ? []
        : show.data.seasons.flatMap((season) => season.episodes),
    [show.data],
  );

  const following = useMemo(
    () => (summary === null || episodes.length === 0 ? null : nextEpisode(episodes, summary)),
    [summary, episodes],
  );

  const decided = decideWhatFollows({
    following,
    carriedOn,
    askAfter: watching.data?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
  });

  const [audio, setAudio] = useState<number | undefined>(undefined);
  const [startFrom, setStartFrom] = useState(startSeconds);
  const [chosenSubtitles, setChosenSubtitles] = useState<string | null>(null);
  const [menu, setMenu] = useState<
    | 'settings'
    | 'subtitles'
    | 'audio'
    | 'quality'
    | 'speed'
    | 'episodes'
    | 'timing'
    | 'captions'
    | 'party'
    | `caption:${CaptionChoiceSet['id']}`
    | null
  >(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const captions = useCaptionStyle();
  const [speed, setSpeed] = useState(1);
  const [isShowingStats, setIsShowingStats] = useState(false);
  const [reading, setReading] = useState<StreamReading>(NOTHING_READ);
  const [quality, setQuality] = useState<QualityPreference>(readQualityPreference);
  const [scrubAt, setScrubAt] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isShowing, setIsShowing] = useState(true);
  const [touchedAt, setTouchedAt] = useState(0);
  const [position, setPosition] = useState(startSeconds);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUpNextAway, setIsUpNextAway] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [status, setStatus] = useState('idle');
  const [heard, setHeard] = useState<string | null>(null);

  const player = useVideoPlayer(null, (made) => {
    made.timeUpdateEventInterval = 0.5;
  });
  const at = useRef({ position: startSeconds, duration: 0, isPlaying: false });
  const isSwitching = useRef(true);
  const session = usePlaybackSession(
    mediaId,
    startFrom,
    () => at.current.isPlaying,
    audio,
    quality,
  );
  const trickplay = useQuery(playbackQueries.trickplay(mediaId));

  useEffect(() => {
    const listening = [
      player.addListener('timeUpdate', ({ currentTime }) => {
        at.current.position = currentTime;
        setPosition(currentTime);
      }),
      player.addListener('sourceLoad', ({ duration: length }) => {
        at.current.duration = length;
        setDuration(length);
      }),
      player.addListener('playingChange', ({ isPlaying: isOn }) => {
        at.current.isPlaying = isOn;
        setIsPlaying(isOn);
      }),
      player.addListener('playToEnd', () => {
        setHasEnded(true);
      }),
      player.addListener('statusChange', ({ status: now, error }) => {
        setStatus(now);

        if (now === 'error' && !isSwitching.current) {
          setFailure(
            error?.message === undefined
              ? say('tv.player.thisCouldNotBePlayedNoReason')
              : whyItWillNotPlay(error.message),
          );
        }
      }),
    ];

    return () => {
      for (const listener of listening) {
        listener.remove();
      }
    };
  }, [player]);

  const partyPlayback = usePartyPlayback(watchParty);
  const party = partyPlayback ?? undefined;
  const playerOf = useCallback(() => roomPlayerOfExpo(player), [player]);
  const inStep = useFollowTheRoom({
    party,
    playerOf,
    isSessionPlaying: session.kind === 'ready' && status === 'readyToPlay',
    onSaid: setHeard,
    onCannotStart: NEVER_REFUSES,
  });
  const everyone = useQuery({
    ...sessionQueries.everyone(),
    enabled: (watchParty?.party ?? null) !== null,
  });
  const household = useMemo(
    () => (everyone.data ?? []).map((person) => ({ id: person.id, name: person.name })),
    [everyone.data],
  );
  const { rememberWhere } = inStep;
  const isInAParty = party !== undefined;

  useEffect(() => {
    if (heard === null) {
      return;
    }

    const gone = setTimeout(() => {
      setHeard(null);
    }, SAID_FOR_MS);

    return () => {
      clearTimeout(gone);
    };
  }, [heard]);

  const moveTo = useCallback(
    (seconds: number) => {
      if (party !== undefined) {
        party.onCommand({ kind: 'seek', atSeconds: Math.max(0, seconds) });

        return;
      }

      moveTheVideoTo(player, seconds);
    },
    [party, player],
  );

  const title = detail.data?.metadata.seriesTitle ?? detail.data?.title ?? '';
  const episodeLine =
    summary === null || typeof summary.seriesTitle !== 'string'
      ? null
      : say('tv.player.sValueEValue2Title', {
          value: (summary.seasonNumber ?? 1).toString(),
          value2: describeEpisodeNumbers(summary.episodeNumber ?? 1, summary.episodeNumberEnd),
          title: summary.title,
        });

  const isDescribed = !detail.isPending;

  useEffect(() => {
    if (session.kind === 'starting') {
      isSwitching.current = true;
      player.pause();

      return;
    }

    if (session.kind !== 'ready' || !isDescribed) {
      return;
    }

    isSwitching.current = true;

    void player
      .replaceAsync({
        ...session.source,
        metadata: { title, ...(episodeLine === null ? {} : { artist: episodeLine }) },
      })
      .then(() => {
        isSwitching.current = false;
        setFailure(null);
        rememberWhere(startFrom);

        if (startFrom > 0) {
          player.currentTime = startFrom;
        }

        if (!isInAParty) {
          player.play();
        }
      });
  }, [session, isDescribed, player, startFrom, title, episodeLine, rememberWhere, isInAParty]);

  useEffect(() => {
    if (session.kind !== 'ready') {
      return;
    }

    const report = (isFinished = false) => {
      const length =
        at.current.duration > 0 ? at.current.duration : (detail.data?.durationSeconds ?? 0);
      const reached = at.current.position;

      if (length <= 0 || reached <= 0) {
        return;
      }

      void reportWatchProgress(mediaId, {
        positionSeconds: reached,
        durationSeconds: length,
        isFinished: isFinished || reached >= length - FINISHED_WITHIN_SECONDS,
      }).then(() => cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }));
    };

    const timer = setInterval(report, REPORT_EVERY_MILLISECONDS);

    return () => {
      clearInterval(timer);
      report();
    };
  }, [session.kind, mediaId, detail.data?.durationSeconds, cache]);

  const textTracks = useMemo(
    () => (tracks.data ?? []).filter((track) => track.delivery === 'text'),
    [tracks.data],
  );
  const chosenAudio =
    detail.data?.audioStreams.find((stream) => stream.index === audio) ??
    detail.data?.audioStreams.find((stream) => stream.isDefault) ??
    detail.data?.audioStreams[0];
  const subtitles = chosenSubtitles ?? defaultTrackId(textTracks, chosenAudio?.language ?? null);
  const cues = useQuery({
    ...playbackQueries.cues(mediaId, subtitles),
    enabled: subtitles !== SUBTITLES_OFF,
  });

  const touch = useCallback(() => {
    setIsShowing(true);
    setTouchedAt(Date.now());
  }, []);

  const toggle = useCallback(() => {
    if (party !== undefined) {
      party.onCommand({
        kind: party.isPlaying ? 'pause' : 'play',
        atSeconds: at.current.position,
      });

      return;
    }

    if (at.current.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [party, player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const length = at.current.duration > 0 ? at.current.duration : Number.MAX_SAFE_INTEGER;

      moveTo(Math.min(Math.max(0, at.current.position + seconds), length));
    },
    [moveTo],
  );

  useRemoteControlled({
    mediaId,
    title,
    subtitle: episodeLine,
    hasBackdrop: summary?.hasBackdrop ?? false,
    isPlaying,
    read: () => ({ position: at.current.position, duration: at.current.duration }),
    onPause: () => {
      if (party === undefined) {
        player.pause();
      } else {
        party.onCommand({ kind: 'pause', atSeconds: at.current.position });
      }
    },
    onResume: () => {
      if (party === undefined) {
        player.play();
      } else {
        party.onCommand({ kind: 'play', atSeconds: at.current.position });
      }
    },
    onSeek: moveTo,
    onStop: onLeave,
  });

  useEffect(() => {
    if (!isShowing || !isPlaying || menu !== null) {
      return;
    }

    const timer = setTimeout(() => {
      setIsShowing(false);
    }, HIDES_AFTER_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isShowing, isPlaying, menu, touchedAt]);

  const held = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrubBy = useCallback(
    (seconds: number) => {
      const length = at.current.duration;

      setScrubAt((was) =>
        Math.min(Math.max(0, (was ?? at.current.position) + seconds), length > 0 ? length : 0),
      );
      touch();
    },
    [touch],
  );

  const letGo = useCallback(() => {
    if (held.current !== null) {
      clearInterval(held.current);
      held.current = null;
    }
  }, []);

  const holdScrubbing = useCallback(
    (heading: -1 | 1) => {
      letGo();

      let steps = 0;

      held.current = setInterval(() => {
        steps += 1;
        scrubBy(
          heading * Math.min(SCRUBS_BY * (1 + steps * HELD_SPEEDS_UP_BY), HELD_STEPS_AT_MOST),
        );
      }, HELD_STEPS_EVERY_MS);
    },
    [letGo, scrubBy],
  );

  useEffect(() => {
    if (!isScrubbing || menu !== null) {
      letGo();
    }
  }, [isScrubbing, menu, letGo]);

  useEffect(() => letGo, [letGo]);

  useRemoteRing(isScrubbing && menu === null, (degrees) => {
    scrubBy((degrees / 360) * A_TURN_SCRUBS);
  });

  const hearRemote = useCallback(
    (event: HWEvent) => {
      if (menu !== null || event.eventType === 'menu' || event.eventType === 'back') {
        return;
      }

      if (event.eventType === 'playPause') {
        toggle();
        touch();

        return;
      }

      if (isScrubbing && (event.eventType === 'longLeft' || event.eventType === 'longRight')) {
        if (event.eventKeyAction === 1) {
          letGo();
        } else {
          holdScrubbing(event.eventType === 'longLeft' ? -1 : 1);
        }

        return;
      }

      if (isScrubbing && (event.eventType === 'left' || event.eventType === 'right')) {
        scrubBy(event.eventType === 'left' ? -SCRUBS_BY : SCRUBS_BY);

        return;
      }

      if (!isShowing && event.eventType === 'left') {
        seekBy(-SKIPS_BY);
      }

      if (!isShowing && event.eventType === 'right') {
        seekBy(SKIPS_BY);
      }

      touch();
    },
    [menu, isShowing, isScrubbing, toggle, touch, seekBy, scrubBy, letGo, holdScrubbing],
  );

  useTVEventHandler(hearRemote);

  useEffect(() => {
    playTheVideoAt(player, speed);
  }, [player, speed]);

  useEffect(() => {
    if (!isShowingStats) {
      return;
    }

    const read = () => {
      const track = player.videoTrack;

      setReading({
        positionSeconds: player.currentTime,
        bufferedSeconds: player.bufferedPosition,
        width: track?.size.width ?? null,
        height: track?.size.height ?? null,
        mimeType: track?.mimeType ?? null,
        bitrate: track?.bitrate ?? track?.averageBitrate ?? null,
        frameRate: track?.frameRate ?? null,
        range: track?.videoRange ?? null,
      });
    };

    read();

    const timer = setInterval(read, STATS_READ_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isShowingStats, player]);

  const backToSettings = useCallback(() => {
    setMenu('settings');
    touch();
  }, [touch]);

  const closeMenu = useCallback(() => {
    setMenu(null);
    touch();
  }, [touch]);

  const putControlsAway = useCallback(() => {
    setIsShowing(false);
  }, []);

  const isAskedForAPassword = watchParty !== undefined && watchParty.passwordWanted !== null;

  useMenuButton(
    isAskedForAPassword
      ? () => {
          watchParty.stopAsking();
        }
      : menu === 'settings'
        ? closeMenu
        : menu?.startsWith('caption:') === true
          ? () => {
              setMenu('captions');
            }
          : menu !== null
            ? backToSettings
            : isShowing && isPlaying
              ? putControlsAway
              : onLeave,
  );

  const goNext = useCallback(
    (followedOn: boolean) => {
      if (following !== null) {
        onNext(following, followedOn ? carriedOn + 1 : 0);
      }
    },
    [following, onNext, carriedOn],
  );

  useEffect(() => {
    if (!hasEnded) {
      return;
    }

    if (decided.kind === 'nothing') {
      onLeave();
    } else if (decided.kind === 'play') {
      goNext(true);
    }
  }, [hasEnded, decided.kind, onLeave, goNext]);

  const skippable = skippableAt(segments.data ?? [], position);
  const credits = (segments.data ?? []).find((segment) => segment.kind === 'credits');
  const length = duration > 0 ? duration : (detail.data?.durationSeconds ?? 0);
  const isCreditsRolling =
    length > 0 &&
    (credits === undefined
      ? position >= length - UP_NEXT_BEFORE_END
      : position >= credits.startSeconds);
  const isOfferingNext =
    following !== null &&
    decided.kind !== 'nothing' &&
    !isUpNextAway &&
    (isCreditsRolling || hasEnded);

  if (session.kind === 'failed' || failure !== null) {
    return (
      <View style={styles.middle}>
        <Text style={styles.problem}>{session.kind === 'failed' ? session.reason : failure}</Text>
        <Button
          label={say('common.goBack')}
          variant="secondary"
          hasPreferredFocus
          onPress={onLeave}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <VideoView
        player={player}
        pointerEvents="none"
        nativeControls={false}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />

      {subtitles === SUBTITLES_OFF ? null : (
        <SubtitleLine
          cues={cues.data ?? []}
          position={position - subtitleOffset}
          isLifted={isShowing}
          captionStyle={captions.style}
        />
      )}

      {session.kind === 'starting' ? (
        <View style={[StyleSheet.absoluteFill, styles.waiting]}>
          <ActivityIndicator size="large" color={tokens.colours.text} />
        </View>
      ) : null}

      {isShowing && menu === null ? (
        <PlayerControls
          title={title}
          year={detail.data?.year ?? null}
          certification={detail.data?.metadata.certification ?? null}
          subtitle={episodeLine}
          scrubAt={scrubAt}
          trickplay={trickplay.data ?? null}
          onScrubFocus={() => {
            setIsScrubbing(true);
          }}
          onScrubBlur={() => {
            setIsScrubbing(false);
            setScrubAt(null);
          }}
          onScrubPress={() => {
            if (scrubAt !== null) {
              moveTo(scrubAt);
              setScrubAt(null);
            }

            touch();
          }}
          onSettings={() => {
            setMenu('settings');
          }}
          position={position}
          duration={length}
          isPlaying={isPlaying}
          onToggle={toggle}
          onSeekBy={seekBy}
          onTouched={touch}
          onNext={
            following === null
              ? null
              : () => {
                  goNext(false);
                }
          }
        />
      ) : null}

      {skippable === null || menu !== null || isOfferingNext ? null : (
        <View style={styles.skip}>
          <Button
            label={describeSkip(skippable)}
            icon={SkipForward}
            variant="confirm"
            size="md"
            hasPreferredFocus={!isShowing}
            onPress={() => {
              moveTo(skippable.endSeconds);
              touch();
            }}
          />
        </View>
      )}

      {isOfferingNext && menu === null ? (
        <UpNext
          episode={following}
          isAsking={decided.kind === 'ask'}
          onPlay={() => {
            goNext(false);
          }}
          onStay={() => {
            setIsUpNextAway(true);

            if (hasEnded) {
              onLeave();
            }
          }}
        />
      ) : null}

      {isShowingStats ? (
        <StreamStats
          title={title}
          mediaId={mediaId}
          detail={detail.data ?? null}
          session={session.kind === 'ready' ? session.started : null}
          sessionStartSeconds={startFrom}
          quality={qualityLabelOf(quality)}
          reading={reading}
        />
      ) : null}

      {menu === 'settings' ? (
        <SettingsMenu
          settings={[
            { id: 'quality', label: say('common.quality'), value: qualityLabelOf(quality) },
            ...(chosenAudio === undefined
              ? []
              : [
                  {
                    id: 'audio',
                    label: say('common.audio'),
                    value: describeAudioTrack(
                      chosenAudio,
                      (detail.data?.audioStreams.indexOf(chosenAudio) ?? 0) + 1,
                    ),
                  },
                ]),
            {
              id: 'subtitles',
              label: say('common.subtitles'),
              value: textTracks.find((track) => track.id === subtitles)?.label ?? say('common.off'),
            },
            ...(subtitles === SUBTITLES_OFF
              ? []
              : [
                  {
                    id: 'timing',
                    label: say('common.subtitleTiming'),
                    value: describeSubtitleOffset(subtitleOffset),
                  },
                  {
                    id: 'captions',
                    label: say('common.captionSettings'),
                    value: say('common.percent', { value: captions.style.fontScale.toString() }),
                  },
                ]),
            { id: 'speed', label: say('common.speed'), value: speedLabelOf(speed) },
            ...(episodes.length < 2 || summary === null
              ? []
              : [
                  {
                    id: 'episodes',
                    label: say('common.episodes'),
                    value: placeOfEpisode(summary),
                  },
                ]),
            ...(watchParty === undefined
              ? []
              : [
                  {
                    id: 'party',
                    label: say('common.partyMenu.watchParty'),
                    value:
                      watchParty.party?.kind === 'watch'
                        ? sayCount(
                            'common.partyPanel.countWatching',
                            watchParty.party.members.filter((member) => member.isWatching).length,
                          )
                        : say('common.off'),
                  },
                ]),
            {
              id: 'stats',
              label: say('common.statsForNerds'),
              value: isShowingStats ? say('common.on') : say('common.off'),
            },
          ]}
          onOpen={(id) => {
            if (id === 'stats') {
              setIsShowingStats((was) => !was);
              closeMenu();

              return;
            }

            if (
              id === 'quality' ||
              id === 'audio' ||
              id === 'subtitles' ||
              id === 'speed' ||
              id === 'episodes' ||
              id === 'timing' ||
              id === 'captions' ||
              id === 'party'
            ) {
              setMenu(id);
            }
          }}
        />
      ) : null}

      {watchParty !== undefined && (menu === 'party' || isAskedForAPassword) ? (
        <PartyPanel
          kind="watch"
          watchParty={watchParty}
          mediaId={mediaId}
          people={household}
          onLeave={closeMenu}
        />
      ) : null}

      {heard === null && (watchParty?.notice ?? null) === null ? null : (
        <View style={styles.said} pointerEvents="none">
          <Text style={styles.saying}>{heard ?? watchParty?.notice}</Text>
        </View>
      )}

      {menu === 'timing' ? (
        <TrackMenu
          title={say('common.subtitleTiming')}
          chosen={subtitleOffset.toString()}
          choices={SUBTITLE_NUDGES.map((nudge) => ({
            id: nudge.toString(),
            label: describeSubtitleOffset(nudge),
          }))}
          onChoose={(id) => {
            setSubtitleOffset(Number(id));
            backToSettings();
          }}
        />
      ) : null}

      {menu === 'captions' ? (
        <SettingsMenu
          title={say('common.captionSettings')}
          settings={captionChoices(captions.style).map((set) => ({
            id: set.id,
            label: set.heading,
            value: set.choices.find((choice) => choice.id === set.chosen)?.label ?? set.chosen,
          }))}
          onOpen={(id) => {
            const set = captionChoices(captions.style).find((one) => one.id === id);

            if (set !== undefined) {
              setMenu(`caption:${set.id}`);
            }
          }}
        />
      ) : null}

      {captionChoices(captions.style)
        .filter((set) => menu === `caption:${set.id}`)
        .map((set) => (
          <TrackMenu
            key={set.id}
            title={set.heading}
            chosen={set.chosen}
            choices={set.choices}
            onChoose={(id) => {
              captions.change(set.choose(id));
              setMenu('captions');
            }}
          />
        ))}

      {menu === 'episodes' ? (
        <TrackMenu
          title={say('common.episodes')}
          chosen={mediaId}
          choices={episodes.map((episode) => ({
            id: episode.id,
            label: placeOfEpisode(episode),
            detail: episode.title,
          }))}
          onChoose={(id) => {
            const chosen = episodes.find((episode) => episode.id === id);

            if (chosen === undefined || chosen.id === mediaId) {
              closeMenu();

              return;
            }

            onNext(chosen, 0);
          }}
        />
      ) : null}

      {menu === 'speed' ? (
        <TrackMenu
          title={say('common.speed')}
          chosen={speed.toString()}
          choices={SPEEDS.map((one) => ({ id: one.toString(), label: speedLabelOf(one) }))}
          onChoose={(id) => {
            setSpeed(Number(id));
            closeMenu();
          }}
        />
      ) : null}

      {menu === 'subtitles' ? (
        <TrackMenu
          title={say('common.subtitles')}
          chosen={subtitles}
          choices={[
            { id: SUBTITLES_OFF, label: say('common.off') },
            ...textTracks.map((track) => ({ id: track.id, label: track.label })),
          ]}
          onChoose={(id) => {
            setChosenSubtitles(id);
            closeMenu();
          }}
        />
      ) : null}

      {menu === 'quality' ? (
        <TrackMenu
          title={say('common.quality')}
          chosen={quality}
          choices={[
            {
              id: 'original',
              label:
                detail.data === undefined || detail.data === null
                  ? say('common.original')
                  : originalLabel(detail.data),
            },
            ...QUALITY_STEPS.filter(
              (step) => step.maxHeight <= (detail.data?.height ?? Number.MAX_SAFE_INTEGER),
            ).map((step) => {
              const isNoSmaller = stepsSavingNothing.includes(step.id);
              const said = qualityStepDetail({ cost: stepCosts[step.id], isNoSmaller });

              return {
                id: step.id,
                label: step.label,
                ...(said === undefined ? {} : { detail: said }),
                ...(isNoSmaller ? { isDisabled: true } : {}),
              };
            }),
          ]}
          onChoose={(id) => {
            const chosen = QualityPreferenceSchema.safeParse(id);

            if (chosen.success && chosen.data !== quality) {
              saveQualityPreference(chosen.data);
              setStartFrom(at.current.position);
              setQuality(chosen.data);
            }

            closeMenu();
          }}
        />
      ) : null}

      {menu === 'audio' && detail.data !== undefined && detail.data !== null ? (
        <TrackMenu
          title={say('common.audio')}
          chosen={String(chosenAudio?.index ?? '')}
          choices={detail.data.audioStreams.map((stream, place) => ({
            id: String(stream.index),
            label: describeAudioTrack(stream, place + 1),
          }))}
          onChoose={(id) => {
            const index = Number(id);

            if (index !== chosenAudio?.index) {
              setStartFrom(at.current.position);
              setAudio(index);
            }

            closeMenu();
          }}
        />
      ) : null}
    </View>
  );
};

Player.displayName = 'Player';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'black' },
  waiting: { alignItems: 'center', justifyContent: 'center' },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.lg,
    backgroundColor: tokens.colours.canvas,
  },
  problem: { color: tokens.colours.text, fontSize: tokens.type.body, maxWidth: 1200 },
  skip: { position: 'absolute', right: tokens.space.edge, bottom: tokens.space.xl * 3 },
  said: {
    position: 'absolute',
    top: tokens.space.xl,
    alignSelf: 'center',
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(12,12,12,0.88)',
  },
  saying: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
});

export { Player };
