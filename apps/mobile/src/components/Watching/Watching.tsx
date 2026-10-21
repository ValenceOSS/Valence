import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hasWatchedToTheEnd } from '@ValenceContracts/schemas/WatchProgress';
import { useVideoPlayer, VideoView } from 'expo-video';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import {
  fetchSubtitleTracks,
  SUBTITLES_OFF,
  trackForLanguage,
} from '@ValenceClient/playback/fetchSubtitles';
import {
  readAudioLanguage,
  readSubtitleLanguage,
  saveAudioLanguage,
  saveSubtitleLanguage,
} from '@ValenceClient/playback/languagePreference';
import { fetchSegments } from '@ValenceClient/playback/fetchSegments';
import { playbackQueries } from '@ValenceClient/query/playbackQueries';
import { namePlaying } from '@ValenceClient/playback/namePlaying';
import {
  posterForAFile,
  sourceForAFile,
  trickplayForAFile,
} from '@ValenceClient/downloads/keepingFiles';
import { rememberWatchedOffline, watchedOffline } from '@ValenceClient/offline/watchedOffline';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { holdWatching } from '@ValenceClient/playback/holdWatching';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { setThePace } from '@ValenceMobile/playback/setThePace';
import {
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  startPlaybackSession,
  stopPlaybackSession,
} from '@ValenceClient/playback/startPlaybackSession';
import {
  REPORT_EVERY_MILLISECONDS,
  reportWatchProgress,
} from '@ValenceClient/playback/watchProgress';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import { spatialiseEvenStereo } from '@ValenceMobile/playback/spatialiseEvenStereo';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { nextEpisode } from '@ValenceCore/functions/nextEpisode';
import { hasReachedTheEnd } from '@ValenceClient/playback/hasReachedTheEnd';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { turnThisPhoneSideways } from '@ValenceMobile/platform/turnThisPhoneSideways';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TheLeap } from '@ValenceMobile/components/Watching/components/TheLeap/TheLeap';
import { useTapsOnThePicture } from '@ValenceMobile/components/Watching/useTapsOnThePicture';
import { TheChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices';
import { TheNotice } from '@ValenceMobile/components/TheNotice/TheNotice';
import { TheMovingParts } from '@ValenceMobile/components/Watching/components/TheMovingParts/TheMovingParts';
import { useTheSubtitles } from '@ValenceMobile/components/Watching/useTheSubtitles';
import { useCaptionStyle } from '@ValenceClient/playback/useCaptionStyle';
import { howBigToDrawIt } from '@ValenceMobile/components/Watching/howBigToDrawIt';
import { usePinchToFill } from '@ValenceMobile/components/Watching/usePinchToFill';
import { theChoicesOn } from '@ValenceMobile/components/Watching/theChoicesOn';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { useTheWait } from '@ValenceMobile/components/Watching/useTheWait';
import { TheAudioAndSubtitles } from '@ValenceMobile/components/Watching/components/TheAudioAndSubtitles/TheAudioAndSubtitles';
import { TheSpeed } from '@ValenceMobile/components/Watching/components/TheSpeed/TheSpeed';
import { TheEpisodes } from '@ValenceMobile/components/Watching/components/TheEpisodes/TheEpisodes';
import { TheStats } from '@ValenceMobile/components/Watching/components/TheStats/TheStats';
import { TheUnlock } from '@ValenceMobile/components/Watching/components/TheUnlock/TheUnlock';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { APlayerList } from '@ValenceMobile/components/Watching/components/APlayerList/APlayerList';
import { describeStreamStats } from '@ValenceClient/playback/describeStreamStats';
import {
  readQualityPreference,
  saveQualityPreference,
} from '@ValenceClient/playback/qualityPreference';
import { originalLabel } from '@ValenceCore/functions/originalLabel';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { APartyPanel } from '@ValenceMobile/components/APartyPanel/APartyPanel';
import { roomPlayerOfExpo } from '@ValenceNative/party/roomPlayerOfExpo';
import { useFollowTheRoom } from '@ValenceClient/party/useFollowTheRoom';
import { usePartyPlayback } from '@ValenceClient/party/usePartyPlayback';
import { useAskableAlong } from '@ValenceClient/party/useAskableAlong';
import type { WatchingProps } from './Watching.types';
import type { VideoSource, VideoView as VideoViewRef } from 'expo-video';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { MediaSegment } from '@ValenceClient/playback/fetchSegments';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { StreamReading } from '@ValenceClient/playback/describeStreamStats';
import { say } from '@ValenceI18n/say';
import { whatToConvertNext } from '@ValenceClient/playback/whatToConvertNext';
import type { Converted } from '@ValenceContracts/schemas/Converted';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';

const SAY_IT_IS_ALIVE_EVERY = 30_000;

const LOOK_EVERY = 1000;

const ASK_FOR_FRAMES_AGAIN_EVERY = 10_000;

const LEAVE_THEM_UP_FOR = 3500;

const FADING_IN = 160;

const FADING_OUT = 240;

const ZOOMING = 220;

const HOW_OFTEN_IT_SAYS_WHERE_IT_IS = 0.25;

const NO_SEASONS: NonNullable<WatchingProps['seasons']> = [];

const NO_SEGMENTS: MediaSegment[] = [];

const NO_CHAPTERS: VideoChapter[] = [];

const SAID_FOR = 4000;

const READ_THE_STATS_EVERY = 1000;

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

type APanel = 'audio' | 'speed' | 'quality' | 'style' | 'episodes' | 'stats' | 'party';

/**
 * Nothing, for a player that cannot refuse to start the way a browser can.
 */
const NEVER_REFUSES = () => undefined;

/**
 * Says how long the thing playing runs: as the library knows it, where it does, since a stream still
 * being made knows only the part made so far; otherwise as the file says, as a downloaded one does.
 *
 * @param known - How long the library says it runs, or nothing where it has not said.
 * @param playerSays - How long the player says it runs.
 * @returns How long it runs.
 */
const lengthOf = (known: number, playerSays: number): number => (known > 0 ? known : playerSays);

const styles = StyleSheet.create({
  picture: { backgroundColor: '#000000', flex: 1 },
  waiting: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

/**
 * Watching one title.
 *
 * The stream is negotiated before anything is drawn, because what the server sends back is the
 * answer to what this phone said it could take — and the address to play is not known until it has.
 *
 * Where a film has its intro or its credits marked, going past them is offered while they are
 * playing and at no other time. That offer is drawn whether the controls are up or not, because it
 * is the one thing here somebody is waiting for rather than looking for.
 *
 * iOS is told it may place a two channel soundtrack around somebody wearing headphones, which it
 * will not do unless asked and which no React Native package asks for it. Said once the film has
 * loaded, because it is said about the film rather than about the application.
 *
 * Whatever comes back is handed to the system's own player rather than driven from here. It is the
 * thing on this platform that knows about picture-in-picture, the lock screen and the route the
 * sound is going out by, and reimplementing any of that in JavaScript would be worse at all three.
 *
 * The player is made once, before there is anything to play, and handed each stream as it is
 * negotiated, so what it is told about itself — to keep playing out of sight, to show on the lock
 * screen, how often to say where it is — is told at once, and it starts, from wherever it was left,
 * each time a stream has loaded rather than when it is made.
 *
 * Leaving the app carries the film on in a picture floating over everything else, and the lock
 * screen shows it by its name and poster — as they were known when the stream began, since telling
 * the player anything new about its source starts the film again.
 *
 * This is the one screen a phone is turned for, and it turns itself: almost everything a household
 * watches was shot wide, and a phone held upright shows it as a strip across the middle.
 *
 * Whether the controls are wanted and whether they are still drawn are two questions: they are let
 * go of once the fade has had time to finish, rather than when it says it has. The fade is run off
 * the main thread so it does not stutter against a playing film, and a thing running over there
 * cannot be waited on over here.
 *
 * Two fingers pushed apart fill the screen with the picture and drawn together fit it inside,
 * which is what a pinch does to a video everywhere else on a phone. Fitted means inside everything
 * the phone has put over its screen, not merely letterboxed: the whole reason somebody pinches a
 * film smaller is to get the cutout off it, and a picture that still runs under the cutout has not
 * done the one thing it was asked. Filled gives that up on purpose in exchange for the bands.
 *
 * The gesture is taken before the picture sees it, so a second finger never also counts as a tap
 * and brings the controls up.
 *
 * It fills the screen from the moment it opens, and its controls are Valence's own rather than the
 * system's. The system's are good but they are a closed box: nothing can be drawn over them and
 * nothing added to them, and a subtitle track or a quality this server can send is a thing they
 * have never heard of. They also show nothing to pick between, because what this server sends is
 * one rendition with one sound on it.
 *
 * It is handed this phone's cookies with it. Everything else on here is asked for through the
 * system's own networking, which attaches them; the player builds its own requests and is not told
 * to consult the jar, so without this a film is asked for by somebody the server does not know.
 *
 * Where somebody is picking up part way, the server is asked to start there and the player is
 * seeked to the same moment, whatever it was sent: a transcode's playlist lays out the whole film,
 * as a file sent untouched does, and only starts its work at the segment asked for. So the player's
 * clock is always the film's own, which is what the subtitles and every saved position are timed
 * against.
 *
 * Something watched to within its credits is written down as finished, which is what takes it off
 * the list of things to carry on with and counts it as seen.
 *
 * Where they have got to is sampled every second and written down every ten, and the last sample
 * is what goes down on the way out rather than a fresh reading: the player is released before this
 * screen's own tidying runs, so asking it anything then is asking a thing that is already gone.
 *
 * The session is ended on the way out, including where they left before the server had finished
 * answering. A session left open is a transcode still running on somebody's server for a film
 * nobody is watching.
 *
 * Thumbnails for the scrubber are asked for again every few seconds until they exist, since the
 * first time a film is asked about the server only starts making them.
 *
 * Two quick taps on either half of the picture move ten seconds that way, as YouTube does, and one
 * tap shows or hides the controls.
 *
 * Whoever runs the server is obeyed as on the web: stopped, the film stops and says why; paused, it
 * pauses and holds the reason over the picture; a message of theirs is held there too until it is
 * dismissed; and resumed, it plays on.
 *
 * @param mediaId - What to watch.
 * @param startSeconds - Where to begin.
 * @param onDone - Told they have stopped watching.
 * @param onEnded - Told the film has played to its end, so whoever opened it can decide what follows.
 * @param seasons - The programme's seasons, where this is an episode of one, to offer the others.
 * @param onChooseEpisode - Told which other episode somebody picked, or the next one, taken from the
 *   offer of it as this one ends.
 * @param willCarryOn - Whether the next episode starts on its own when this one ends, rather than
 *   asking first, so the offer of it counts down only when it will.
 * @param kept - A copy this phone keeps, played straight from the file with nothing asked of the
 * server: named from what was kept, scrubbed with the thumbnails kept beside it, resumed from where
 * it was left on this phone, and remembered there until the server can be told.
 * @param watchParty - The watch party this phone holds. Where it is watching this, the film is kept
 * in step with the room — playing, pausing and moving go to the room rather than straight to the
 * player, and what the others did is said over the picture — and the party is opened from the
 * controls, to start one, see who is in it or leave. A copy kept on the phone is never in one.
 */
const Watching = ({
  mediaId,
  startSeconds = 0,
  onDone,
  onEnded,
  seasons = NO_SEASONS,
  onChooseEpisode,
  willCarryOn = false,
  kept,
  watchParty,
}: WatchingProps) => {
  const cache = useQueryClient();
  const [source, setSource] = useState<VideoSource | null>(null);
  const [seekTo, setSeekTo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sentAudio, setSentAudio] = useState<number | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const whereTheyGotTo = useRef<{ positionSeconds: number; durationSeconds: number } | null>(null);
  const knownLength = useRef(0);
  const picture = useRef<VideoViewRef | null>(null);
  const [areControlsUp, setAreControlsUp] = useState(true);
  const [areControlsDrawn, setAreControlsDrawn] = useState(true);
  const [fade] = useState(() => new Animated.Value(1));
  const { howClose, pinching } = usePinchToFill();
  const room = useSafeAreaInsets();
  const [screen, setScreen] = useState({ width: 0, height: 0 });
  const [howBig] = useState(() => new Animated.Value(1));
  const [lastTouched, setLastTouched] = useState(0);
  const [panel, setPanel] = useState<APanel | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [session, setSession] = useState<StartedSession | null>(null);
  const [streamReading, setStreamReading] = useState<StreamReading>(NOTHING_READ);
  const isChoosing = panel !== null && panel !== 'party';
  const isPartying = panel === 'party';
  const [heard, setHeard] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isKept = kept !== undefined;
  const frames = useQuery({
    queryKey: ['playback', 'trickplay', mediaId],
    queryFn: () => fetchTrickplay(mediaId),
    staleTime: Infinity,
    enabled: !isKept,
    refetchInterval: (query) => (query.state.data === null ? ASK_FOR_FRAMES_AGAIN_EVERY : false),
  });
  const keptFrames = useQuery({
    queryKey: ['held', 'trickplay', kept?.downloadId],
    queryFn: () => (kept === undefined ? null : trickplayForAFile(kept.downloadId)),
    staleTime: Infinity,
    enabled: isKept,
    networkMode: 'always',
  });
  const [rate, setRate] = useState(1);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const captions = useCaptionStyle();
  const [asking, setAsking] = useState<{
    from: number;
    audioStreamIndex?: number;
    requestedQuality?: QualityPreference;
    subtitleStreamIndex?: number | undefined;
    converted?: Converted;
  }>(() => ({
    from:
      kept === undefined
        ? startSeconds
        : (watchedOffline().find((one) => one.mediaId === mediaId)?.positionSeconds ??
          startSeconds),
    requestedQuality: kept === undefined ? readQualityPreference() : 'original',
  }));
  const [askingFor, setAskingFor] = useState(mediaId);

  if (askingFor !== mediaId) {
    setAskingFor(mediaId);
    setAsking((asked) =>
      asked.requestedQuality === undefined
        ? { from: startSeconds }
        : { from: startSeconds, requestedQuality: asked.requestedQuality },
    );
    setRefusal(null);
    setPanel(null);
    setSession(null);
    setSessionId(null);
    setStreamReading(NOTHING_READ);
    setSubtitleOffset(0);
  }

  const clientId = platformInUse().thisClientId();
  const title = useQuery({ ...libraryQueries.detail(mediaId), enabled: !isKept });

  useEffect(() => {
    knownLength.current = title.data?.durationSeconds ?? 0;
  }, [title.data?.durationSeconds]);
  const called =
    kept !== undefined
      ? namePlaying({ title: kept.title, seriesTitle: kept.seriesTitle })
      : title.data === undefined || title.data === null
        ? null
        : namePlaying({ ...title.data.metadata, title: title.data.title, year: title.data.year });
  const named = useRef<string | undefined>(undefined);

  useEffect(() => {
    named.current = called?.name;
  }, [called?.name]);
  const tracks = useQuery({
    queryKey: ['subtitles', mediaId],
    queryFn: () => fetchSubtitleTracks(mediaId),
    enabled: !isKept,
  });
  const marked = useQuery({
    queryKey: ['segments', mediaId],
    queryFn: () => fetchSegments(mediaId),
    enabled: !isKept,
  });
  const chaptered = useQuery({ ...playbackQueries.chapters(mediaId), enabled: !isKept });
  const [reading, setReading] = useState(SUBTITLES_OFF);
  const carriedOver = useRef<string | null>(null);

  useEffect(() => {
    if (carriedOver.current === mediaId || tracks.data === undefined) {
      return;
    }

    carriedOver.current = mediaId;

    const remembered = readSubtitleLanguage();

    if (remembered === null || remembered === SUBTITLES_OFF) {
      return;
    }

    const continuing = trackForLanguage(tracks.data, remembered);

    if (continuing !== null) {
      setReading(continuing.id);
    }
  }, [tracks.data, mediaId]);
  const beingRead = (tracks.data ?? []).find((track) => track.id === reading) ?? null;
  const cues = useTheSubtitles(mediaId, reading, beingRead?.delivery === 'burnIn');

  useEffect(() => {
    if (kept === undefined) {
      return undefined;
    }

    setSeekTo(asking.from);
    setSource({
      uri: sourceForAFile(kept.downloadId),
      metadata: {
        ...(named.current === undefined ? {} : { title: named.current }),
        ...(kept.hasPoster ? { artwork: posterForAFile(kept.downloadId) } : {}),
      },
    });

    return undefined;
  }, [kept, asking]);

  useEffect(() => {
    if (isKept) {
      return undefined;
    }

    let started: string | null = null;
    let leftAlready = false;
    const letGo = holdWatching(clientId);

    setSource(null);

    const rememberedAudio = asking.audioStreamIndex === undefined ? readAudioLanguage() : null;

    void (
      rememberedAudio === null
        ? Promise.resolve(asking.audioStreamIndex)
        : cache
            .ensureQueryData(libraryQueries.detail(mediaId))
            .then((known) => {
              const heard = known?.audioStreams.find(
                (stream) => stream.language === rememberedAudio,
              );

              return heard === undefined || heard.isDefault ? undefined : heard.index;
            })
            .catch(() => undefined)
    )
      .then((audioStreamIndex) =>
        startPlaybackSession(
          mediaId,
          thePhonesProfile(),
          clientId,
          Math.floor(asking.from),
          audioStreamIndex,
          asking.requestedQuality,
          asking.subtitleStreamIndex,
          asking.converted,
        ),
      )
      .then((outcome) => {
        if (outcome.kind === 'failed') {
          setRefusal(outcome.reason);

          return;
        }

        started = outcome.session.sessionId;
        setSession(outcome.session);
        setSentAudio(outcome.session.plan.audio.streamIndex);

        if (leftAlready) {
          void stopPlaybackSession(started, clientId);

          return;
        }

        const uri = onThisServer(
          outcome.session.delivery.kind === 'direct'
            ? outcome.session.delivery.url
            : outcome.session.delivery.manifestUrl,
        );
        const wasStarted = started;

        void theCookiesThisPhoneHolds(uri).then((cookie) => {
          if (leftAlready) {
            return;
          }

          setSeekTo(asking.from);
          setSessionId(wasStarted);
          const artwork = onThisServer(artworkUrl(mediaId, 'poster'));
          const told = {
            uri,
            metadata: named.current === undefined ? { artwork } : { title: named.current, artwork },
          };

          setSource(cookie === null ? told : { ...told, headers: { Cookie: cookie } });
        });
      });

    return () => {
      leftAlready = true;

      if (started !== null) {
        void stopPlaybackSession(started, clientId);
      }

      letGo();
    };
  }, [mediaId, asking, clientId, isKept, cache]);

  const player = useVideoPlayer(source, (ready) => {
    ready.timeUpdateEventInterval = HOW_OFTEN_IT_SAYS_WHERE_IT_IS;
    ready.showNowPlayingNotification = true;
    ready.staysActiveInBackground = true;
  });

  const status = useEvent(player, 'statusChange', { status: player.status });
  const refusedSession = useRef<string | null>(null);
  const tryingNext = useRef({ session, converted: asking.converted, isKept });

  useEffect(() => {
    tryingNext.current = { session, converted: asking.converted, isKept };
  });

  useEventListener(player, 'statusChange', ({ status: now, error }) => {
    const { session: playing, converted: already, isKept: isHeld } = tryingNext.current;

    if (now !== 'error' || playing === null || isHeld) {
      return;
    }

    const refused = `${playing.sessionId} ${already ?? 'copied'}`;

    if (refusedSession.current === refused) {
      return;
    }

    refusedSession.current = refused;

    const next = whatToConvertNext({ plan: playing.plan, converted: already, fault: null });

    if (next !== null) {
      setAsking((asked) => ({ ...asked, converted: next, from: player.currentTime }));

      return;
    }

    setRefusal(
      error?.message === undefined
        ? say('tv.player.thisCouldNotBePlayedNoReason')
        : say('tv.player.thisCouldNotBePlayedMessage', { message: error.message }),
    );
  });
  const wait = useTheWait(source === null || status.status === 'loading');
  const partyPlayback = usePartyPlayback(watchParty, mediaId);
  const party = isKept || partyPlayback === null ? undefined : partyPlayback;
  const playerOf = useCallback(() => roomPlayerOfExpo(player), [player]);
  const inStep = useFollowTheRoom({
    party,
    playerOf,
    isSessionPlaying: source !== null && status.status === 'readyToPlay',
    onSaid: setHeard,
    onCannotStart: NEVER_REFUSES,
  });
  const household = useAskableAlong((watchParty?.party ?? null) !== null);

  useEventListener(player, 'sourceLoad', () => {
    inStep.rememberWhere(seekTo);

    if (seekTo > 0) {
      player.seekBy(seekTo - player.currentTime);
    }

    if (party === undefined) {
      player.play();
    }
  });

  useEffect(() => {
    if (heard === null) {
      return;
    }

    const gone = setTimeout(() => {
      setHeard(null);
    }, SAID_FOR);

    return () => {
      clearTimeout(gone);
    };
  }, [heard]);

  const following = useMemo(() => {
    const all = seasons.flatMap((season) => season.episodes);
    const playing = all.find((episode) => episode.id === mediaId);

    return playing === undefined || onChooseEpisode === undefined
      ? null
      : nextEpisode(all, playing);
  }, [seasons, mediaId, onChooseEpisode]);

  const seekedToTheEnd = useRef(false);
  const [isHeldAtTheEnd, setIsHeldAtTheEnd] = useState(false);

  useEffect(() => {
    seekedToTheEnd.current = false;
    setIsHeldAtTheEnd(false);
  }, [mediaId]);

  const moveTo = useCallback(
    (seconds: number) => {
      seekedToTheEnd.current = following !== null && hasReachedTheEnd(seconds, player.duration);

      if (isHeldAtTheEnd && !seekedToTheEnd.current) {
        setIsHeldAtTheEnd(false);

        if (party === undefined) {
          player.play();
        }
      }

      if (party !== undefined) {
        party.onCommand({ kind: 'seek', atSeconds: Math.max(0, seconds) });

        return;
      }

      player.seekBy(seconds - player.currentTime);
    },
    [party, player, following, isHeldAtTheEnd],
  );

  const moving = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const loaded = useEvent(player, 'sourceLoad');

  useEventListener(player, 'playToEnd', () => {
    if (source === null || !(player.duration > 0)) {
      return;
    }

    if (seekedToTheEnd.current) {
      whereTheyGotTo.current = {
        positionSeconds: player.currentTime,
        durationSeconds: lengthOf(knownLength.current, player.duration),
      };
      setIsHeldAtTheEnd(true);

      return;
    }

    onEnded?.();
  });

  const keepThemUp = useCallback(() => {
    setAreControlsUp(true);
    setLastTouched(Date.now());
  }, []);

  const toggleTheControls = useCallback(() => {
    setAreControlsUp((up) => !up);
  }, []);

  const leapBy = useCallback(
    (by: number) => {
      moveTo(player.currentTime + by);
    },
    [moveTo, player],
  );

  const playOrPause = useCallback(() => {
    keepThemUp();

    if (party !== undefined) {
      party.onCommand({
        kind: party.isPlaying ? 'pause' : 'play',
        atSeconds: player.currentTime,
      });

      return;
    }

    if (moving.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [keepThemUp, party, player, moving.isPlaying]);

  const { tapped, leap } = useTapsOnThePicture(
    screen.width,
    toggleTheControls,
    leapBy,
    areControlsUp ? playOrPause : toggleTheControls,
  );

  const readInstead = useCallback(
    (trackId: string) => {
      const wanted = (tracks.data ?? []).find((track) => track.id === trackId) ?? null;

      setReading(trackId);
      saveSubtitleLanguage(
        trackId === SUBTITLES_OFF ? SUBTITLES_OFF : (wanted?.language ?? SUBTITLES_OFF),
      );

      const burning = wanted?.delivery === 'burnIn' ? (wanted.streamIndex ?? undefined) : undefined;

      if (burning === asking.subtitleStreamIndex) {
        return;
      }

      setAsking((asked) => ({
        ...asked,
        subtitleStreamIndex: burning,
        from: player.currentTime,
      }));
    },
    [tracks.data, asking.subtitleStreamIndex, player],
  );

  const askAgain = useCallback(
    (changed: { audioStreamIndex?: number; requestedQuality?: QualityPreference }) => {
      setPanel(null);
      setAsking((asked) => ({ ...asked, ...changed, from: player.currentTime }));
    },
    [player],
  );

  useEffect(() => {
    if (sessionId === null) {
      return;
    }

    const beat = setInterval(() => {
      void heartbeatPlaybackSession(sessionId, player.playing, clientId);
      void sendPresenceHeartbeat(clientId, player.playing);
    }, SAY_IT_IS_ALIVE_EVERY);

    return () => {
      clearInterval(beat);
    };
  }, [sessionId, clientId, player]);

  useEffect(() => turnThisPhoneSideways(), []);

  useEffect(() => {
    spatialiseEvenStereo(player);
  }, [player, loaded]);

  useEffect(() => {
    Animated.timing(howBig, {
      toValue: howBigToDrawIt(howClose, screen, room),
      duration: ZOOMING,
      useNativeDriver: true,
    }).start();
  }, [howClose, screen, room, howBig]);

  useEffect(() => {
    if (areControlsUp) {
      setAreControlsDrawn(true);
    }

    Animated.timing(fade, {
      toValue: areControlsUp ? 1 : 0,
      duration: areControlsUp ? FADING_IN : FADING_OUT,
      useNativeDriver: true,
    }).start();

    if (areControlsUp) {
      return;
    }

    const gone = setTimeout(() => {
      setAreControlsDrawn(false);
    }, FADING_OUT);

    return () => {
      clearTimeout(gone);
    };
  }, [areControlsUp, fade]);

  useEffect(() => {
    if (!areControlsUp || !moving.isPlaying || isChoosing || isPartying) {
      return;
    }

    const going = setTimeout(() => {
      setAreControlsUp(false);
    }, LEAVE_THEM_UP_FOR);

    return () => {
      clearTimeout(going);
    };
  }, [areControlsUp, moving.isPlaying, isChoosing, isPartying, lastTouched]);

  useEffect(() => {
    if (sessionId === null && !isKept) {
      return;
    }

    whereTheyGotTo.current = null;

    const looking = setInterval(() => {
      if (player.duration > 0) {
        whereTheyGotTo.current = {
          positionSeconds: player.currentTime,
          durationSeconds: lengthOf(knownLength.current, player.duration),
        };
      }
    }, LOOK_EVERY);

    const bookmark = (isLeaving: boolean) => {
      const seen = whereTheyGotTo.current;

      if (seen !== null && isKept) {
        rememberWatchedOffline(mediaId, seen.positionSeconds, seen.durationSeconds);

        return;
      }

      if (seen !== null) {
        void reportWatchProgress(
          mediaId,
          {
            ...seen,
            isFinished: hasWatchedToTheEnd(seen.positionSeconds, seen.durationSeconds),
          },
          { isLeaving },
        );
      }
    };

    const saving = setInterval(() => {
      bookmark(false);
    }, REPORT_EVERY_MILLISECONDS);

    return () => {
      clearInterval(looking);
      clearInterval(saving);
      bookmark(true);
    };
  }, [sessionId, mediaId, player, isKept]);

  useEffect(() => {
    setThePace(player, rate);
  }, [player, rate]);

  useEffect(
    () =>
      onPresenceEvent((event) => {
        if (event.kind === 'stopped') {
          player.pause();
          Alert.alert(say('phone.watching.playbackWasStopped'), event.reason);
          onDone();

          return;
        }

        if (event.kind === 'paused') {
          player.pause();
          setNotice(event.reason);

          return;
        }

        if (event.kind === 'message') {
          setNotice(event.text);

          return;
        }

        if (event.kind === 'resumed') {
          setNotice(null);
          player.play();
        }
      }),
    [player, onDone],
  );

  useEffect(() => {
    if (panel !== 'stats') {
      return undefined;
    }

    const read = () => {
      const track = player.videoTrack;

      setStreamReading({
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
    const again = setInterval(read, READ_THE_STATS_EVERY);

    return () => {
      clearInterval(again);
    };
  }, [panel, player]);

  const settings = useMemo(
    () =>
      theChoicesOn({
        streams: isKept ? [] : (title.data?.audioStreams ?? []),
        subtitles: isKept ? [] : (tracks.data ?? []),
        chosenSubtitle: reading,
        onSubtitle: readInstead,
        media: isKept ? null : (title.data ?? null),
        profile: thePhonesProfile(),
        chosenAudio: asking.audioStreamIndex ?? sentAudio,
        chosenQuality: asking.requestedQuality ?? 'auto',
        onAudio: (audioStreamIndex) => {
          const heard = title.data?.audioStreams.find(
            (stream) => stream.index === audioStreamIndex,
          );

          if (heard?.language !== undefined && heard.language !== null) {
            saveAudioLanguage(heard.language);
          }

          askAgain({ audioStreamIndex });
        },
        onQuality: (requestedQuality) => {
          saveQualityPreference(requestedQuality);
          askAgain({ requestedQuality });
        },
        captionStyle: captions.style,
        onCaptionStyle: captions.change,
      }),
    [
      isKept,
      title.data,
      tracks.data,
      reading,
      readInstead,
      asking.audioStreamIndex,
      sentAudio,
      asking.requestedQuality,
      askAgain,
      captions.style,
      captions.change,
    ],
  );

  const stopChoosing = useCallback(() => {
    setPanel(null);
    keepThemUp();
  }, [keepThemUp]);

  const chosenQuality = asking.requestedQuality ?? 'auto';
  const qualityLabel =
    chosenQuality === 'auto'
      ? say('common.auto')
      : chosenQuality === 'original'
        ? title.data === undefined || title.data === null
          ? say('common.original')
          : originalLabel(title.data)
        : (QUALITY_STEPS.find((step) => step.id === chosenQuality)?.label ?? chosenQuality);
  if (refusal !== null) {
    return (
      <Screen centres onBack={onDone}>
        <Words tone="danger">{refusal}</Words>
      </Screen>
    );
  }

  return (
    <View
      style={styles.picture}
      onLayout={({ nativeEvent }) => {
        setScreen(nativeEvent.layout);
      }}
      {...pinching.panHandlers}
    >
      <Animated.View style={[styles.picture, { transform: [{ scale: howBig }] }]}>
        <VideoView
          ref={picture}
          style={styles.picture}
          player={player}
          allowsPictureInPicture
          startsPictureInPictureAutomatically
          nativeControls={false}
          contentFit="contain"
        />
      </Animated.View>

      <Button
        tone="bare"
        fills
        label={areControlsUp ? say('common.hideTheControls') : say('common.showTheControls')}
        onPress={isLocked ? toggleTheControls : tapped}
      />

      {notice === null ? null : (
        <TheNotice
          says={notice}
          onDismiss={() => {
            setNotice(null);
          }}
        />
      )}

      {notice !== null || (heard ?? watchParty?.notice ?? null) === null ? null : (
        <TheNotice
          says={heard ?? watchParty?.notice ?? ''}
          onDismiss={() => {
            setHeard(null);
            watchParty?.forgetNotice();
          }}
        />
      )}

      <TheMovingParts
        player={player}
        segments={marked.data ?? NO_SEGMENTS}
        cues={cues}
        subtitleOffset={subtitleOffset}
        captionStyle={captions.style}
        areControlsDrawn={areControlsDrawn && !isLocked && panel === null}
        onMoveTo={(seconds) => {
          keepThemUp();
          moveTo(seconds);
        }}
        next={
          following === null || onChooseEpisode === undefined || panel !== null
            ? null
            : {
                isCounting: willCarryOn && !isHeldAtTheEnd,
                isHeldAtTheEnd,
                runsFor: lengthOf(title.data?.durationSeconds ?? 0, player.duration),
                onPlay: () => {
                  if (player.duration > 0) {
                    whereTheyGotTo.current = {
                      positionSeconds: lengthOf(knownLength.current, player.duration),
                      durationSeconds: lengthOf(knownLength.current, player.duration),
                    };
                  }

                  onChooseEpisode(following.id);
                },
              }
        }
        controls={{
          fade,
          title: called?.name ?? '',
          year: called?.year ?? null,
          isPlaying: moving.isPlaying,
          wait,
          trickplay: (isKept ? keptFrames.data : frames.data) ?? null,
          chapters: chaptered.data ?? NO_CHAPTERS,
          onPlayPause: playOrPause,
          onSkip: (by) => {
            keepThemUp();
            moveTo(player.currentTime + by);
          },
          onTouched: keepThemUp,
          onClose: onDone,
          rate,
          qualityLabel,
          onLock: () => {
            setIsLocked(true);
            setAreControlsUp(false);
          },
          onPictureInPicture: () => {
            void picture.current?.startPictureInPicture().catch(() => undefined);
          },
          onSpeed: () => {
            setPanel('speed');
          },
          onAudioAndSubtitles:
            settings.audio === null && settings.subtitles === null
              ? undefined
              : () => {
                  setPanel('audio');
                },
          onQuality:
            settings.quality === null
              ? undefined
              : () => {
                  setPanel('quality');
                },
          onStats: () => {
            setPanel('stats');
          },
          onEpisodes:
            onChooseEpisode === undefined || seasons.length === 0
              ? undefined
              : () => {
                  setPanel('episodes');
                },
          onNext:
            following === null || onChooseEpisode === undefined
              ? undefined
              : () => {
                  if (player.duration > 0) {
                    whereTheyGotTo.current = {
                      positionSeconds: player.currentTime,
                      durationSeconds: lengthOf(knownLength.current, player.duration),
                    };
                  }

                  onChooseEpisode(following.id);
                },
          onParty:
            isKept || watchParty === undefined
              ? undefined
              : () => {
                  setPanel('party');
                },
        }}
      />

      {wait.isShown && !areControlsDrawn && panel === null ? (
        <View style={styles.waiting} pointerEvents="none">
          <ASpinner
            colour="#ffffff"
            size={PLAYER_LOOK.middle}
            isFinishing={wait.isFinishing}
            onFilled={wait.onFilled}
          />
        </View>
      ) : null}

      {isLocked && areControlsDrawn ? (
        <TheUnlock
          onUnlock={() => {
            setIsLocked(false);
            keepThemUp();
          }}
        />
      ) : null}

      {leap === null ? null : <TheLeap leap={leap} />}

      {panel === 'episodes' && onChooseEpisode !== undefined ? (
        <TheEpisodes
          seasons={seasons}
          playing={mediaId}
          onChoose={(id) => {
            setPanel(null);

            if (id !== mediaId) {
              onChooseEpisode(id);
            }
          }}
          onClose={stopChoosing}
        />
      ) : null}

      {panel === 'audio' ? (
        <TheAudioAndSubtitles
          audio={settings.audio}
          subtitles={settings.subtitles}
          timing={
            reading === SUBTITLES_OFF
              ? null
              : { offset: subtitleOffset, onChange: setSubtitleOffset }
          }
          onStyle={
            settings.captions.length === 0
              ? undefined
              : () => {
                  setPanel('style');
                }
          }
          onClose={stopChoosing}
        />
      ) : null}

      {panel === 'style' ? <TheChoices sets={settings.captions} onClose={stopChoosing} /> : null}

      {panel === 'speed' ? <TheSpeed rate={rate} onRate={setRate} onClose={stopChoosing} /> : null}

      {panel === 'quality' && settings.quality !== null ? (
        <APlayerPanel label={say('phone.watching.closeTheQuality')} onClose={stopChoosing}>
          <APlayerList set={settings.quality} />
        </APlayerPanel>
      ) : null}

      {panel === 'stats' ? (
        <TheStats
          groups={describeStreamStats({
            title: called?.name ?? '',
            mediaId,
            detail: isKept ? null : (title.data ?? null),
            session,
            sessionStartSeconds: asking.from,
            quality: chosenQuality,
            reading: streamReading,
          })}
          onClose={stopChoosing}
        />
      ) : null}

      {watchParty !== undefined && !isKept && (isPartying || watchParty.passwordWanted !== null) ? (
        <APartyPanel
          kind="watch"
          watchParty={watchParty}
          mediaId={mediaId}
          people={household}
          onClose={() => {
            if (watchParty.passwordWanted !== null) {
              watchParty.stopAsking();
            }

            setPanel(null);
            keepThemUp();
          }}
        />
      ) : null}
    </View>
  );
};

Watching.displayName = 'Watching';

export { Watching };
