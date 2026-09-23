import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useTVEventHandler, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SkipForward } from '@keyline-icons/react';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { summariseDetail } from '@ValenceClient/library/summariseDetail';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { describeSkip, skippableAt } from '@ValenceClient/playback/fetchSegments';
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
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { FINISHED_WITHIN_SECONDS } from '@ValenceContracts/schemas/WatchProgress';
import { Button } from '@ValenceTv/components/Button/Button';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { useRemoteRing } from '@ValenceTv/remote/useRemoteRing';
import { usePlaybackSession } from '@ValenceTv/playback/usePlaybackSession';
import { PlayerControls } from '@ValenceTv/screens/Player/components/PlayerControls/PlayerControls';
import { SubtitleLine } from '@ValenceTv/screens/Player/components/SubtitleLine/SubtitleLine';
import { SettingsMenu } from '@ValenceTv/screens/Player/components/SettingsMenu/SettingsMenu';
import { StreamStats } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats';
import { TrackMenu } from '@ValenceTv/screens/Player/components/TrackMenu/TrackMenu';
import { UpNext } from '@ValenceTv/screens/Player/components/UpNext/UpNext';
import { tokens } from '@ValenceTv/theme/tokens';
import type { HWEvent } from 'react-native';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { StreamReading } from '@ValenceTv/screens/Player/components/StreamStats/StreamStats.types';
import type { PlayerProps } from './Player.types';

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

/**
 * How a playing speed is said: normal at its own pace, and otherwise as a multiple.
 *
 * @param speed - How fast it plays, where one is its own pace.
 * @returns Its name.
 */
const speedLabelOf = (speed: number): string => (speed === 1 ? 'Normal' : `${speed.toString()}×`);

/**
 * What the settings say for a quality: the original as it is, or the step's own name.
 *
 * @param quality - The quality asked for.
 * @returns Its name.
 */
const qualityLabelOf = (quality: QualityPreference): string =>
  quality === 'original'
    ? 'Original'
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
    ? 'This Valence turned the television away. Its sign-in may have run out, so go back and sign in again.'
    : `This could not be played. (${message})`;

/**
 * Plays a title across the whole screen, with Valence's own controls over it rather than the
 * system's, so that what only Valence knows about can sit beside pause and play: skipping an intro
 * or the credits, choosing subtitles and sound, and moving on to the next episode.
 *
 * The remote works as it does in the television's own player. Play/Pause always pauses or plays;
 * with the controls away, left and right go back and forward ten seconds and any other press brings
 * them up; they go away again after a few seconds of playing untouched, and Menu puts them away
 * before it leaves. As an episode's credits roll the next one is offered, and starts on its own after
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
 */
const Player = ({ mediaId, startSeconds, carriedOn, onLeave, onNext }: PlayerProps) => {
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
  const show = useQuery({
    ...libraryQueries.show(detail.data?.libraryId ?? null, showId),
    enabled: showId !== null && detail.data !== undefined && detail.data !== null,
  });

  const following = useMemo(
    () =>
      summary === null || show.data === undefined || show.data === null
        ? null
        : nextEpisode(
            show.data.seasons.flatMap((season) => season.episodes),
            summary,
          ),
    [summary, show.data],
  );

  const decided = decideWhatFollows({
    following,
    carriedOn,
    askAfter: watching.data?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
  });

  const [audio, setAudio] = useState<number | undefined>(undefined);
  const [startFrom, setStartFrom] = useState(startSeconds);
  const [chosenSubtitles, setChosenSubtitles] = useState<string | null>(null);
  const [menu, setMenu] = useState<'settings' | 'subtitles' | 'audio' | 'quality' | 'speed' | null>(
    null,
  );
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
      player.addListener('statusChange', ({ status, error }) => {
        if (status === 'error' && !isSwitching.current) {
          setFailure(whyItWillNotPlay(error?.message ?? 'the player gave no reason'));
        }
      }),
    ];

    return () => {
      for (const listener of listening) {
        listener.remove();
      }
    };
  }, [player]);

  const title = detail.data?.metadata.seriesTitle ?? detail.data?.title ?? '';
  const episodeLine =
    summary === null || typeof summary.seriesTitle !== 'string'
      ? null
      : `S${(summary.seasonNumber ?? 1).toString()}: E${(summary.episodeNumber ?? 1).toString()} · ${summary.title}`;

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

        if (startFrom > 0) {
          player.currentTime = startFrom;
        }

        player.play();
      });
  }, [session, isDescribed, player, startFrom, title, episodeLine]);

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
    if (at.current.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const length = at.current.duration > 0 ? at.current.duration : Number.MAX_SAFE_INTEGER;

      player.currentTime = Math.min(Math.max(0, at.current.position + seconds), length);
    },
    [player],
  );

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
    player.playbackRate = speed;
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

  useMenuButton(
    menu === 'settings'
      ? closeMenu
      : menu !== null
        ? backToSettings
        : isShowing && isPlaying
          ? putControlsAway
          : null,
    true,
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
        <Button label="Go back" variant="secondary" hasPreferredFocus onPress={onLeave} />
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
        <SubtitleLine cues={cues.data ?? []} position={position} isLifted={isShowing} />
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
              player.currentTime = scrubAt;
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
              player.currentTime = skippable.endSeconds;
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
            goNext(decided.kind === 'play');
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
            { id: 'quality', label: 'Quality', value: qualityLabelOf(quality) },
            ...(chosenAudio === undefined
              ? []
              : [
                  {
                    id: 'audio',
                    label: 'Audio',
                    value: describeAudioTrack(
                      chosenAudio,
                      (detail.data?.audioStreams.indexOf(chosenAudio) ?? 0) + 1,
                    ),
                  },
                ]),
            {
              id: 'subtitles',
              label: 'Subtitles',
              value: textTracks.find((track) => track.id === subtitles)?.label ?? 'Off',
            },
            { id: 'speed', label: 'Speed', value: speedLabelOf(speed) },
            { id: 'stats', label: 'Stats for nerds', value: isShowingStats ? 'On' : 'Off' },
          ]}
          onOpen={(id) => {
            if (id === 'stats') {
              setIsShowingStats((was) => !was);
              closeMenu();

              return;
            }

            if (id === 'quality' || id === 'audio' || id === 'subtitles' || id === 'speed') {
              setMenu(id);
            }
          }}
        />
      ) : null}

      {menu === 'speed' ? (
        <TrackMenu
          title="Speed"
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
          title="Subtitles"
          chosen={subtitles}
          choices={[
            { id: SUBTITLES_OFF, label: 'Off' },
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
          title="Quality"
          chosen={quality}
          choices={[
            { id: 'original', label: 'Original' },
            ...QUALITY_STEPS.filter(
              (step) => step.maxHeight <= (detail.data?.height ?? Number.MAX_SAFE_INTEGER),
            ).map((step) => ({ id: step.id, label: step.label })),
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
          title="Audio"
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
});

export { Player };
