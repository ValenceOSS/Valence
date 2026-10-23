import { manifestToLoad } from '@ValenceScreens/playback/manifestToLoad';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { Icon } from '@ValenceUI/Icon';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { gainFor } from '@ValenceCore/functions/gainFor';
import {
  Cast as CastIcon,
  PictureInPicture as PictureInPictureIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { SkipForward as SkipForwardFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Spinner } from '@ValenceUI/Spinner';
import { useNowPlaying } from '@ValenceScreens/playback/useNowPlaying';
import { useDiscordPresence } from '@ValenceScreens/playback/useDiscordPresence';
import { useAutoQuality } from '@ValenceScreens/playback/useAutoQuality';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { SubtitleCues } from '@ValenceScreens/components/SubtitleCues/SubtitleCues';
import { isStyledSubtitle } from '@ValenceScreens/playback/isStyledSubtitle';
import { useSubtitleFetching } from '@ValenceScreens/playback/useSubtitleFetching';
import { AssSubtitles } from '@ValenceScreens/components/VideoPlayer/components/AssSubtitles/AssSubtitles';
import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { detectFromBrowser } from '@ValenceClient/playback/detectFromBrowser';
import { castDeviceProfile } from '@ValenceClient/playback/castDeviceProfile';
import { castAddressOf } from '@ValenceClient/playback/castAddressOf';
import { qualityStepCostsFor } from '@ValenceClient/playback/qualityStepCostsFor';
import { bufferFor } from '@ValenceClient/playback/bufferFor';
import { rungOfHeight } from '@ValenceClient/playback/rungOfHeight';
import { stepsThatSaveNothing } from '@ValenceClient/playback/stepsThatSaveNothing';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { onPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import {
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
} from '@ValenceClient/playback/startPlaybackSession';
import { attachShaka, CRITICAL } from '@ValenceScreens/playback/attachShaka';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import { PlaybackEngineErrorSchema } from '@ValenceClient/playback/PlaybackEngineErrorSchema';
import {
  watchCastState,
  isReachableOrigin,
  promptForDevice,
  absoluteStreamUrl,
} from '@ValenceScreens/playback/castPlayback';
import { handOverToDevice } from '@ValenceScreens/playback/handOverToDevice';
import { loadCastSender, castStateOf, castStream } from '@ValenceScreens/playback/castSender';
import { followCastPosition } from '@ValenceScreens/playback/followCastPosition';
import { applyVolumeBoost } from '@ValenceScreens/playback/volumeBoost';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { aLeaveWorthHiding } from '@ValenceScreens/playback/aLeaveWorthHiding';
import { hasReachedTheEnd } from '@ValenceClient/playback/hasReachedTheEnd';
import { tapZoneOf } from '@ValenceClient/playback/tapZoneOf';
import type { TapZone } from '@ValenceClient/playback/tapZoneOf';
import { fadeBeforeTheEnd } from '@ValenceClient/playback/fadeBeforeTheEnd';
import { fadeAfterTheStart } from '@ValenceClient/playback/fadeAfterTheStart';
import { whatIsPlaying } from '@ValenceScreens/playback/whatIsPlaying';
import { SKIP_SECONDS } from './components/PlayerControls/PlayerControls.types';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { popOutWithCaptions } from '@ValenceScreens/playback/popOutWithCaptions';
import { captureFrame } from '@ValenceScreens/playback/captureFrame';
import { readPlaybackHealth, bufferedAhead } from '@ValenceScreens/playback/readPlaybackHealth';
import {
  fetchSubtitleTracks,
  subtitleTrackUrl,
  defaultTrackId,
  trackForLanguage,
  SUBTITLES_OFF,
} from '@ValenceClient/playback/fetchSubtitles';
import {
  readCaptionStyle,
  saveCaptionStyle,
  DEFAULT_CAPTION_STYLE,
} from '@ValenceClient/playback/captionStyle';
import {
  readQualityPreference,
  saveQualityPreference,
} from '@ValenceClient/playback/qualityPreference';
import { fetchSegments, skippableAt, describeSkip } from '@ValenceClient/playback/fetchSegments';
import { fetchChapters } from '@ValenceClient/playback/fetchChapters';
import { ContentAdvisory } from '@ValenceScreens/components/VideoPlayer/components/ContentAdvisory/ContentAdvisory';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';
import { nextEpisodeOfferAt } from '@ValenceClient/playback/nextEpisodeOfferAt';
import { segmentAt } from '@ValenceClient/playback/segmentAt';
import { nextEpisode } from '@ValenceCore/functions/nextEpisode';
import { REPORT_EVERY_MILLISECONDS } from '@ValenceClient/playback/watchProgress';
import { createProgressReporter } from '@ValenceClient/playback/createProgressReporter';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import {
  readPlaybackPreferences,
  writePlaybackPreferences,
} from '@ValenceScreens/playback/playbackPreferences';
import { describeAudioTrack } from '@ValenceCore/functions/describeTrack';
import { listAvailableQualitySteps } from '@ValenceCore/functions/listAvailableQualitySteps';
import { originalLabel } from '@ValenceCore/functions/originalLabel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { TrickplayPreview } from './components/TrickplayPreview/TrickplayPreview';
import { PlayerControls } from './components/PlayerControls/PlayerControls';
import { StreamStats } from './components/StreamStats/StreamStats';
import { cn } from '@ValenceUI/cn';
import { Toaster } from '@ValenceUI/Toaster';
import { notify } from '@ValenceUI/notify';
import { useFollowTheRoom } from '@ValenceClient/party/useFollowTheRoom';
import type { RoomPlayer } from '@ValenceClient/party/RoomPlayer';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { DrawnPicture, PoppedOut } from '@ValenceScreens/playback/popOutWithCaptions';
import type { CastState } from '@ValenceScreens/playback/castPlayback.types';
import { describePlaying } from './describePlaying';
import { PausedScreen } from './components/PausedScreen/PausedScreen';
import { NextEpisodeCard } from './components/NextEpisodeCard/NextEpisodeCard';
import type { CastContext } from '@ValenceScreens/playback/castSender.types';
import { aKeptSession } from '@ValenceClient/downloads/aKeptSession';
import { sourceForAFile, trickplayForAFile } from '@ValenceClient/downloads/keepingFiles';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { isOfflineNow } from '@ValenceClient/offline/isOfflineNow';
import { holdWatching } from '@ValenceClient/playback/holdWatching';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import { whatToConvertNext } from '@ValenceClient/playback/whatToConvertNext';
import type { Converted } from '@ValenceContracts/schemas/Converted';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import { subtitleCuesUrl } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { PlaybackHealth } from './components/StreamStats/StreamStats.types';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { AutoRung } from '@ValenceClient/playback/decideAutoQuality';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { PlayerState, VideoPlayerProps } from './VideoPlayer.types';
import { ProblemScreen } from './components/ProblemScreen/ProblemScreen';
import { describePlaybackProblem } from '@ValenceClient/playback/describePlaybackProblem';
import { describeProblemDetails } from '@ValenceClient/playback/describeProblemDetails';
import { problemOfAFault } from '@ValenceClient/playback/problemOfAFault';
import { reportWhatStopped } from '@ValenceClient/playback/reportWhatStopped';
import { useKeepsTheScreenOn } from '@ValenceScreens/playback/useKeepsTheScreenOn';
import { waitForTheServer } from '@ValenceClient/session/waitForTheServer';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';
import { FindSubtitlesDialog } from '@ValenceScreens/components/FindSubtitlesDialog/FindSubtitlesDialog';
import { PlayOnDialog } from '@ValenceScreens/components/PlayOnDialog/PlayOnDialog';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { PictureCanvas } from '@ValenceUI/PictureCanvas';
import { attachEngine } from '@ValenceScreens/playback/engine/attachEngine';
import { attachRemux } from '@ValenceScreens/playback/engine/attachRemux';
import { chooseBrowserRoute } from '@ValenceClient/playback/chooseBrowserRoute';
import { readEngineSupport } from '@ValenceScreens/playback/readEngineSupport';
import { withTheEngine } from '@ValenceClient/playback/withTheEngine';
import { isPlayedNatively } from '@ValenceClient/playback/isPlayedNatively';
import type { EngineStats } from '@ValenceScreens/playback/engine/EngineStats';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
type FullscreenTarget = {
  requestFullscreen?: () => Promise<void>;
};
type FullscreenOwner = {
  exitFullscreen?: () => Promise<void>;
};
type FullscreenVideo = {
  requestFullscreen?: () => Promise<void>;
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
};

const ADVISORY_SHOWS_MS = 7000;

const IDLE_MILLISECONDS = 2500;

const PAUSED_SCREEN_MILLISECONDS = 10_000;

const DOUBLE_TAP_MILLISECONDS = 300;

const TAP_EDGE = 0.33;

const SKIPS_SETTLE_MILLISECONDS = 300;

const LADDER_READ_EVERY_MILLISECONDS = 2000;

const STALL_BEFORE_SAYING_SO_MS = 400;

const PLAYER_TOASTS = 'player';

const ASK_FOR_FRAMES_AGAIN_EVERY_MS = 10_000;

const ADMIN_NOTICE = 'admin-notice';

const PICTURE_WATCH_MS = 2000;

const STILL_PICTURE_CHECKS = 2;

const STILL_PICTURE_MOVES_SECONDS = 1.5;

const ELEMENT_COULD_NOT_DECODE = 3;

const ELEMENT_COULD_NOT_READ = 4;

const PARTY_NOTICE = 'party-notice';

const CAST_NOTICE = 'cast-notice';

const JUMP_SECONDS = 30;

const CLEAR_OF_THE_CONTROLS = 12;

const CLEAR_OF_THE_EDGE = 24;

const HEALTH_INTERVAL_MILLISECONDS = 500;

const MOST_FRAME_SKEW_SECONDS = 30;

/**
 * What to say while the room is waiting, which is the difference between a picture that has stopped
 * and a picture that is broken.
 *
 * @param names - Whoever the room is waiting for.
 * @returns The line to show.
 */
const waitingWord = (names: readonly string[]): string => {
  if (names.length === 0) {
    return say('screens.videoPlayer.gettingTheRoomInStep');
  }

  return names.length === 1
    ? say('screens.videoPlayer.waitingForName', { name: names[0] ?? '' })
    : sayCount('screens.videoPlayer.waitingForPeople', names.length);
};

const WAITING_FOR_MORE = {
  extra: 'screens.videoPlayer.waitingForMoreOfThis',
  episode: 'screens.videoPlayer.waitingForMoreOfTheEpisode',
  film: 'screens.videoPlayer.waitingForMoreOfTheFilm',
} as const;

const HEARTBEAT_INTERVAL_MILLISECONDS = 30_000;

const PRESENCE_HEALTH_INTERVAL_MILLISECONDS = 1000;

const DEFAULT_FRAME_SECONDS = 1 / 25;

const START_RETRY_MILLISECONDS = 1500;

const START_ATTEMPTS = 4;

/**
 * Stops a transcode session nobody is waiting for any more, which happens when a start was retried
 * and an earlier attempt arrives late, or when the viewer left mid-start. Fire and forget: there is
 * nothing useful to do about a failure to tidy up, and nobody left to tell.
 *
 * @param sessionId - The session to stop.
 * @param clientId - Which device is letting go of it.
 */
const abandonStartedSession = (sessionId: string, clientId: string) => {
  void stopPlaybackSession(sessionId, clientId);
};

const EMPTY_HEALTH: PlaybackHealth = {
  positionSeconds: 0,
  bufferedAheadSeconds: 0,
  frameSeconds: 0,
  streamFromSeconds: 0,
  encodedSeconds: 0,
  droppedFrames: null,
  decodedFrames: null,
  presentedWidth: 0,
  presentedHeight: 0,
};

/**
 * Plays a library item: asks the server for a session, attaches the player to whatever the server
 * decided to send — a direct file or an adaptive stream — and stays out of the way from then on.
 * Owns everything about a viewing that outlives a single control: where the viewer has got to and
 * reporting it back, which tracks are chosen, what the captions look like, whether an administrator
 * has intervened, and what happens when an episode ends and the next one is waiting.
 *
 * @param media - What is being played, and how long it runs.
 * @param isImmersive - Whether the player fills the screen or sits within the page.
 * @param startSeconds - Where to begin, for somebody picking up where they left off.
 * @param onClose - Called when the viewer leaves the player.
 * @param onProgress - Called as the viewer moves through it, with where they are and how long it is.
 * @param onEnded - Called when it reaches the end of its own accord.
 * @param episodes - Every episode of the programme, where this is one episode of one.
 * @param following - The episode that plays after this one, where the caller knows better than the
 *   episodes given do; worked out from them where not given.
 * @param onSelectEpisode - Called with an episode the viewer chose instead of this one, and with the
 *   next one when they take up the offer of it as this one ends.
 * @param willCarryOn - Whether the next episode starts on its own when this one ends, rather than
 *   asking first, so the offer of it counts down only when it will.
 * @param watchedFractionFor - How to ask how far through a given episode the viewer already is.
 * @param party - The watch party this viewing is part of, where it is part of one.
 * @param partyNotice - Something the party has to say, which may outlive the party itself.
 * @param renderPartyMenu - How to draw the watch party control in the bar, told when the bar has gone.
 * @param keptDownloadId - The download of a copy kept on this device, which is played, and scrubbed
 * through with its own thumbnails, instead of asking the server for a session.
 */
const VideoPlayer = ({
  media,
  isImmersive = false,
  startSeconds = 0,
  onClose,
  onProgress,
  onEnded,
  episodes = [],
  following: givenFollowing,
  onSelectEpisode,
  willCarryOn = false,
  watchedFractionFor,
  party,
  partyNotice = null,
  renderPartyMenu,
  keptDownloadId,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pictureRef = useRef<HTMLCanvasElement>(null);
  const [isDrawnByTheEngine, setIsDrawnByTheEngine] = useState(false);
  const engineRefusedRef = useRef(false);
  const enginePictureRef = useRef<DrawnPicture | null>(null);
  const [enginePicture, setEnginePicture] = useState<{ width: number; height: number } | null>(
    null,
  );
  const engineStatsRef = useRef<(() => EngineStats) | null>(null);
  const brightenRef = useRef<((brightness: number) => void) | null>(null);
  const switchCopyRef = useRef<((rung: AutoRung) => Promise<void>) | null>(null);
  const [browserRung, setBrowserRung] = useState<AutoRung | null>(null);
  const [keptSteps, setKeptSteps] = useState<QualityStepId[]>([]);
  const [canSwitchCopies, setCanSwitchCopies] = useState(false);
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const statsDrag = useDragControls();
  const startTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSilencedByPolicyRef = useRef(false);
  const frameSecondsRef = useRef(DEFAULT_FRAME_SECONDS);
  const cache = useQueryClient();
  const { isOffline } = useOfflineMode();
  const isOfflineRef = useRef(isOffline);
  const keptSource = keptDownloadId === undefined ? undefined : sourceForAFile(keptDownloadId);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  });
  const [session, setSession] = useState<StartedSession | null>(null);
  const [sessionMadeFor, setSessionMadeFor] = useState<{
    isCast: boolean;
    burnInSubtitleId: string | undefined;
  }>({ isCast: false, burnInSubtitleId: undefined });
  const [state, setState] = useState<PlayerState>('starting');
  const [stoppedBy, setStoppedBy] = useState<{
    problem: PlaybackProblem;
    cause: string | null;
    reason: string | null;
  } | null>(null);
  const hasPlayedRef = useRef(false);
  const playingRef = useRef(describePlaying(media));

  useEffect(() => {
    playingRef.current = describePlaying(media);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const whoIsWatching = useQuery(profileQueries.watching());
  const [position, setPosition] = useState(0);
  const [isArriving, setIsArriving] = useState(false);
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const fadedOutRef = useRef(false);
  const [reportedDuration, setReportedDuration] = useState(0);
  const reachedRef = useRef({ mediaId: media.id, seconds: 0 });
  const reportReachedRef = useRef<(isLeaving?: boolean) => Promise<boolean>>(() =>
    Promise.resolve(false),
  );
  const [trickplay, setTrickplay] = useState<Trickplay | null>(null);
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [advisedFor, setAdvisedFor] = useState<string | null>(null);
  const [isAdvising, setIsAdvising] = useState(false);
  const deviceProfile = useMemo(
    () =>
      detectFromBrowser(
        window,
        document.createElement('video'),
        platformInUse().describeThisClient(),
      ),
    [],
  );
  const [volume, setVolume] = useState(() => readPlaybackPreferences().volume);
  const [boost, setBoost] = useState(() => readPlaybackPreferences().boost);
  const [hdrBrightness, setHdrBrightness] = useState(() => readPlaybackPreferences().hdrBrightness);
  const hdrBrightnessRef = useRef(hdrBrightness);
  const isToneMappedHere =
    detail !== null &&
    detail.videoRange !== 'SDR' &&
    !window.matchMedia('(dynamic-range: high)').matches;
  const [isMuted, setIsMuted] = useState(() => readPlaybackPreferences().isMuted);
  const [isShowingRemaining, setIsShowingRemaining] = useState(
    () => readPlaybackPreferences().showsRemaining,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShowingStats, setIsShowingStats] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [nextHiddenFor, setNextHiddenFor] = useState<string | null>(null);
  const [heldAtTheEndOf, setHeldAtTheEndOf] = useState<string | null>(null);
  const seekedToTheEndRef = useRef(false);
  const playsOnFromTheEndRef = useRef(false);
  const [health, setHealth] = useState<PlaybackHealth>(EMPTY_HEALTH);
  const [delivered, setDelivered] = useState<DeliveredFormat | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const pointRef = useRef<{ x: number; y: number } | null>(null);
  const hasFinishedRef = useRef(false);
  const [activity, setActivity] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [isFindingSubtitles, setIsFindingSubtitles] = useState(false);
  const { mayAdminister } = useWhatIMayDo();
  const [selectedSubtitleId, setSelectedSubtitleId] = useState(SUBTITLES_OFF);
  const defaultedForRef = useRef<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState(readCaptionStyle);
  const [subtitleOffset, setSubtitleOffset] = useState(0);

  const [segments, setSegments] = useState<MediaSegment[]>([]);
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number | null>(null);
  const [request, setRequest] = useState<{
    mediaId: string;
    startSeconds: number;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    burnInSubtitleId?: string | undefined;
    requestedQuality: QualityPreference;
    autoRung: AutoRung;
    converted?: Converted;
    isCast?: boolean;
  }>({
    mediaId: media.id,
    startSeconds: Math.floor(startSeconds),
    requestedQuality: readQualityPreference(),
    autoRung: 'original',
  });
  const [heldFrame, setHeldFrame] = useState<{ url: string; isItemChange: boolean } | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsTall, setControlsTall] = useState(0);

  const isAWindowOfOurOwn = isTheDesktopClient();

  const canPopOut =
    !isAWindowOfOurOwn &&
    typeof document !== 'undefined' &&
    document.pictureInPictureEnabled === true;

  const poppedRef = useRef<PoppedOut | null>(null);
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [castState, setCastState] = useState<CastState>('unavailable');
  const [isOnAChromecast, setIsOnAChromecast] = useState(false);
  const [sendingAt, setSendingAt] = useState<number | null>(null);
  const hasTelevision = useVideoDevices().some((device) => device.kind === 'tv');

  const [isBuffering, setIsBuffering] = useState(false);
  const [isSayingSo, setIsSayingSo] = useState(false);

  const frameSkewRef = useRef(0);

  const sayWhatTheRoomDid = useCallback((said: string) => {
    notify.say(said, { where: PLAYER_TOASTS, id: PARTY_NOTICE });
  }, []);

  const sayItWillNotStart = useCallback(() => {
    notify.say(say('screens.videoPlayer.yourBrowserWillNotStartThis'), {
      where: PLAYER_TOASTS,
      id: PARTY_NOTICE,
    });
  }, []);

  const theElement = useCallback((): RoomPlayer | null => {
    const element = videoRef.current;

    return element === null
      ? null
      : {
          readyState: () => element.readyState,
          currentSeconds: () => element.currentTime,
          frameSkewSeconds: () => frameSkewRef.current,
          bufferedAheadSeconds: () => bufferedAhead(element),
          isPaused: () => element.paused,
          isSeeking: () => element.seeking,
          seekTo: (seconds) => {
            element.currentTime = seconds;
          },
          play: () => element.play(),
          pause: () => {
            element.pause();
          },
          setRate: (rate) => {
            element.preservesPitch = true;
            element.playbackRate = rate;
          },
        };
  }, []);

  const { rememberWhere } = useFollowTheRoom({
    party,
    playerOf: theElement,
    isSessionPlaying: state === 'playing',
    onSaid: sayWhatTheRoomDid,
    onCannotStart: sayItWillNotStart,
  });

  const hasStalled = state === 'playing' && (isBuffering || party?.isHeld === true);

  useKeepsTheScreenOn(state === 'playing' && isPlaying);

  if (state === 'playing' && advisedFor !== media.id) {
    setAdvisedFor(media.id);
    setIsAdvising(true);
  }

  useEffect(() => {
    if (!isAdvising) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsAdvising(false);
    }, ADVISORY_SHOWS_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isAdvising, advisedFor]);

  useEffect(() => {
    if (!hasStalled) {
      setIsSayingSo(false);

      return;
    }

    const says = setTimeout(() => {
      setIsSayingSo(true);
    }, STALL_BEFORE_SAYING_SO_MS);

    return () => {
      clearTimeout(says);
    };
  }, [hasStalled]);

  useEffect(() => {
    if (partyNotice !== null) {
      notify.say(partyNotice, { where: PLAYER_TOASTS });
    }
  }, [partyNotice]);
  const releaseRef = useRef<(() => Promise<void>) | null>(null);
  const deliveredRef = useRef<(() => DeliveredFormat | null) | null>(null);
  const estimatedRef = useRef<(() => number | null) | null>(null);
  const ladderRef = useRef<(() => { variants: number; activeHeight: number | null }) | null>(null);
  const [ladder, setLadder] = useState<{ variants: number; activeHeight: number | null } | null>(
    null,
  );
  const settledRef = useRef<Promise<void>>(Promise.resolve());
  const castContextRef = useRef<CastContext | null>(null);

  const popOut = useCallback(() => {
    const element = videoRef.current;

    if (element === null) {
      return;
    }

    if (document.pictureInPictureElement !== null) {
      poppedRef.current?.stop();
      poppedRef.current = null;
      setIsPoppedOut(false);

      void document.exitPictureInPicture().catch(() => {});

      return;
    }

    void (async () => {
      const drawn = enginePictureRef.current;
      const withCaptions =
        drawn !== null || Array.from(element.textTracks).some((track) => track.mode !== 'disabled')
          ? await popOutWithCaptions(element, drawn)
          : null;

      if (withCaptions !== null) {
        poppedRef.current = withCaptions;
        setIsPoppedOut(true);

        return;
      }

      await element.requestPictureInPicture().catch(() => {});
    })();
  }, []);

  useEffect(
    () => () => {
      poppedRef.current?.stop();
      poppedRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (isAWindowOfOurOwn) {
      return;
    }

    let isAbandoned = false;

    void loadCastSender().then((context) => {
      if (isAbandoned || context === null) {
        return;
      }

      castContextRef.current = context;

      const said = () => {
        const state = castStateOf(context);

        setCastState(
          state === 'CONNECTED' ? 'connected' : state === 'CONNECTING' ? 'connecting' : 'available',
        );
        setIsOnAChromecast(state === 'CONNECTED');
      };

      const framework = window.cast?.framework;

      if (framework !== undefined) {
        context.addEventListener(framework.CastContextEventType.CAST_STATE_CHANGED, said);
      }

      said();
    });

    return () => {
      isAbandoned = true;
    };
  }, [isAWindowOfOurOwn]);

  useEffect(() => {
    const element = videoRef.current;

    if (element === null || isAWindowOfOurOwn) {
      return;
    }

    return watchCastState(element, setCastState);
  }, [isAWindowOfOurOwn]);

  const castSubtitles = subtitleTracks.find((track) => track.id === selectedSubtitleId);
  const toBurnIn =
    castState === 'connected' && keptSource === undefined && castSubtitles?.delivery === 'text'
      ? castSubtitles.id
      : undefined;

  useEffect(() => {
    if (toBurnIn === request.burnInSubtitleId) {
      return;
    }

    setRequest((asked) => ({
      ...asked,
      burnInSubtitleId: toBurnIn,
      startSeconds: Math.floor(videoRef.current?.currentTime ?? asked.startSeconds),
    }));
  }, [toBurnIn, request.burnInSubtitleId]);

  const castAtRef = useRef<number | null>(null);
  const castTimeRef = useRef<(seconds: number) => void>(() => undefined);
  const toCast = isOnAChromecast && keptSource === undefined;

  useEffect(() => {
    if (toCast === (request.isCast === true)) {
      return;
    }

    const castAt = castAtRef.current;

    castAtRef.current = null;
    setRequest((asked) => ({
      ...asked,
      isCast: toCast,
      startSeconds: Math.floor(castAt ?? videoRef.current?.currentTime ?? asked.startSeconds),
    }));
  }, [toCast, request.isCast]);

  useEffect(() => {
    if (
      castState !== 'connected' ||
      toBurnIn !== request.burnInSubtitleId ||
      toCast !== (request.isCast === true)
    ) {
      return;
    }

    const element = videoRef.current;
    if (
      element === null ||
      session === null ||
      sessionMadeFor.isCast !== toCast ||
      sessionMadeFor.burnInSubtitleId !== toBurnIn
    ) {
      return;
    }

    const handing: { isOver: boolean; stopFollowing: (() => void) | null } = {
      isOver: false,
      stopFollowing: null,
    };

    const handOver = (address: string) => {
      const context = castContextRef.current;

      if (context === null) {
        void handOverToDevice({
          element,
          url: address,
          origin: window.location.origin,
          ...(releaseRef.current === null
            ? {}
            : {
                release: async () => {
                  await releaseRef.current?.();
                  releaseRef.current = null;
                },
              }),
        });

        return;
      }

      const whole = absoluteStreamUrl(address, window.location.origin);

      if (whole === null) {
        return;
      }

      void castStream(context, {
        url: whole,
        title: media.title,
        startSeconds: element.currentTime,
      }).then((accepted) => {
        if (!accepted) {
          notify.failed(say('screens.videoPlayer.thatDeviceWouldNotTakeThis'), {
            where: PLAYER_TOASTS,
          });

          return;
        }

        element.pause();

        if (!handing.isOver) {
          handing.stopFollowing = followCastPosition((seconds) => {
            castAtRef.current = seconds;
            castTimeRef.current(seconds);
          });
        }
      });
    };

    if (session.delivery.kind === 'direct') {
      handOver(session.delivery.url);
    } else {
      const own = session.delivery.manifestUrl;

      void castAddressOf(session.sessionId).then((ticketed) => {
        if (!handing.isOver) {
          handOver(ticketed ?? own);
        }
      });
    }

    return () => {
      handing.isOver = true;
      handing.stopFollowing?.();
    };
  }, [
    castState,
    session,
    sessionMadeFor,
    media.title,
    toBurnIn,
    request.burnInSubtitleId,
    toCast,
    request.isCast,
  ]);

  const wasCastingRef = useRef(false);

  const start = useCallback((element: HTMLVideoElement, mayReload = true) => {
    let attempts = 0;

    const attempt = () => {
      void element.play().catch((refusal) => {
        if (!(refusal instanceof DOMException) || refusal.name !== 'NotAllowedError') {
          return;
        }

        isSilencedByPolicyRef.current = true;
        element.muted = true;
        setIsMuted(true);

        void element.play().catch(() => {});
      });
    };

    attempt();

    clearInterval(startTimerRef.current ?? undefined);

    startTimerRef.current = setInterval(() => {
      attempts += 1;

      if (!mayReload || attempts > START_ATTEMPTS || element.readyState > 0 || !element.paused) {
        clearInterval(startTimerRef.current ?? undefined);
        startTimerRef.current = null;

        return;
      }

      const at = element.currentTime;

      element.load();
      element.currentTime = at;
      attempt();
    }, START_RETRY_MILLISECONDS);
  }, []);

  useEffect(() => {
    if (castState === 'connected') {
      wasCastingRef.current = true;

      return;
    }

    if (!wasCastingRef.current || castState === 'connecting') {
      return;
    }

    wasCastingRef.current = false;

    if (request.isCast === true || session?.delivery.kind !== 'hls') {
      return;
    }

    setRequest((asked) => ({
      ...asked,
      startSeconds: Math.floor(videoRef.current?.currentTime ?? asked.startSeconds),
    }));
  }, [castState, session, request.isCast]);

  useEffect(
    () => () => {
      void releaseRef.current?.();
      releaseRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const onLeave = () => {
      poppedRef.current?.stop();
      poppedRef.current = null;
      setIsPoppedOut(false);
    };

    const onEnter = () => {
      setIsPoppedOut(true);
    };

    const element = videoRef.current;

    element?.addEventListener('enterpictureinpicture', onEnter);
    element?.addEventListener('leavepictureinpicture', onLeave);
    document.addEventListener('leavepictureinpicture', onLeave);

    return () => {
      element?.removeEventListener('enterpictureinpicture', onEnter);
      element?.removeEventListener('leavepictureinpicture', onLeave);
      document.removeEventListener('leavepictureinpicture', onLeave);

      poppedRef.current?.stop();
      poppedRef.current = null;

      if (document.pictureInPictureEnabled === true && document.pictureInPictureElement !== null) {
        void document.exitPictureInPicture().catch(() => {});
      }
    };
  }, []);

  const hold = useCallback((element: HTMLVideoElement | null, isItemChange = false) => {
    const url = element === null ? null : captureFrame(element, document.createElement('canvas'));

    if (url !== null) {
      setHeldFrame({ url, isItemChange });
    }
  }, []);

  useLayoutEffect(() => {
    const element = videoRef.current;

    if (element !== null && element.readyState > 1) {
      hold(element, true);
    }
  }, [media.id, hold]);

  if (request.mediaId !== media.id) {
    setRequest({
      mediaId: media.id,
      startSeconds: Math.floor(startSeconds),
      requestedQuality: request.requestedQuality,
      autoRung: request.autoRung,
      ...(request.isCast === true ? { isCast: true } : {}),
    });
  }

  const reportPresenceHeartbeat = useCallback(
    (clientId: string) => {
      if (isOfflineRef.current) {
        return;
      }

      const current = videoRef.current;
      const playing = current !== null && !current.paused;

      if (current === null) {
        void sendPresenceHeartbeat(clientId, playing);

        return;
      }

      const measured = readPlaybackHealth(current);
      const totalDuration =
        media.durationSeconds > 0
          ? media.durationSeconds
          : Number.isFinite(current.duration)
            ? current.duration
            : 0;

      void sendPresenceHeartbeat(clientId, playing, {
        positionSeconds: measured.positionSeconds,
        durationSeconds: totalDuration,
        bufferedAheadSeconds: measured.bufferedAheadSeconds,
        presentedWidth: measured.presentedWidth,
        presentedHeight: measured.presentedHeight,
      });
    },
    [media.durationSeconds],
  );

  useEffect(() => {
    setSession(null);
    setIsDrawnByTheEngine(false);
    setEnginePicture(null);
    enginePictureRef.current = null;
    engineStatsRef.current = null;
    brightenRef.current = null;
    switchCopyRef.current = null;
    setBrowserRung(null);
    setKeptSteps([]);
    setCanSwitchCopies(false);
    setState('starting');
    setStoppedBy(null);
    hasPlayedRef.current = false;
    setIsPlaying(false);
    setPosition(request.startSeconds);
    setReportedDuration(0);
    rememberWhere(request.startSeconds);

    const controller = new AbortController();
    const isAbandoned = () => controller.signal.aborted;
    let teardown: (() => Promise<void>) | null = null;
    let startedId: string | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let presenceHealthInterval: ReturnType<typeof setInterval> | null = null;
    let stopWaiting: (() => void) | null = null;
    let pictureWatch: ReturnType<typeof setInterval> | null = null;
    let noteProgress: (() => void) | null = null;
    let progressOn: HTMLVideoElement | null = null;
    const stopAt = (problem: PlaybackProblem, cause: string | null) => {
      if (isAbandoned()) {
        return;
      }

      videoRef.current?.pause();
      setStoppedBy({ problem, cause, reason: null });
      setState('failed');
      reportWhatStopped({
        problem,
        cause,
        title: playingRef.current,
        positionSeconds: videoRef.current?.currentTime ?? null,
        how: null,
        sessionId: startedId,
        mediaId: request.mediaId,
        clientId,
      });
    };
    const reconnect = () => {
      if (isAbandoned() || stopWaiting !== null) {
        return;
      }

      const resumeAt =
        hasPlayedRef.current && videoRef.current !== null
          ? Math.floor(videoRef.current.currentTime)
          : null;

      setState('reconnecting');
      stopWaiting = waitForTheServer({
        onBack: () => {
          if (isAbandoned()) {
            return;
          }

          setRequest((asked) => ({
            ...asked,
            startSeconds: resumeAt ?? asked.startSeconds,
          }));
        },
        onGaveUp: () => {
          stopWaiting = null;
          stopAt('unreachable', null);
        },
      });
    };
    const clientId = platformInUse().thisClientId();

    const onPageHide = () => {
      if (isOfflineNow()) {
        return;
      }

      void reportReachedRef.current(true);

      if (startedId !== null) {
        void stopPlaybackSession(startedId, clientId, true);
      }

      void stopWatching(clientId, true);
    };

    window.addEventListener('pagehide', onPageHide);

    const run = async () => {
      const rememberedAudio =
        request.audioStreamIndex === undefined && keptSource === undefined
          ? readPlaybackPreferences().audioLanguage
          : null;
      const known =
        rememberedAudio === null
          ? null
          : await cache.ensureQueryData(libraryQueries.detail(request.mediaId)).catch(() => null);
      const remembered =
        known?.audioStreams.find((stream) => stream.language === rememberedAudio) ?? null;
      const audioStreamIndex =
        request.audioStreamIndex ??
        (remembered === null || remembered.isDefault ? undefined : remembered.index);
      const film =
        keptSource === undefined &&
        request.isCast !== true &&
        !engineRefusedRef.current &&
        readPlaybackPreferences().playsInTheBrowser
          ? await cache.ensureQueryData(libraryQueries.detail(request.mediaId)).catch(() => null)
          : null;
      const engine = film === null ? null : await readEngineSupport();
      const asked =
        audioStreamIndex === undefined
          ? null
          : (film?.audioStreams.find((stream) => stream.index === audioStreamIndex) ?? null);
      const isWhole =
        request.requestedQuality === 'original' ||
        (request.requestedQuality === 'auto' && request.autoRung === 'original');
      const mayPickSound =
        isWhole && engine !== null && asked !== null && engine.audioCodecs.includes(asked.codec);
      const ask = (heardIndex: number | undefined) =>
        startPlaybackSession(
          request.mediaId,
          request.isCast === true
            ? castDeviceProfile(
                castContextRef.current?.getCurrentSession()?.getCastDevice()?.friendlyName ??
                  deviceProfile.name,
              )
            : engine === null || film === null
              ? deviceProfile
              : withTheEngine(deviceProfile, engine, {
                  isHdr: film.videoRange !== 'SDR',
                  height: film.height,
                }),
          clientId,
          request.startSeconds,
          heardIndex,
          request.requestedQuality === 'auto' ? request.autoRung : request.requestedQuality,
          request.subtitleStreamIndex,
          request.converted,
          request.burnInSubtitleId,
          request.isCast,
        );
      const first =
        keptSource === undefined
          ? await ask(mayPickSound ? undefined : audioStreamIndex)
          : ({ kind: 'started', session: aKeptSession(request.mediaId, keptSource) } as const);
      const isServerMade =
        mayPickSound && first.kind === 'started' && first.session.delivery.kind !== 'direct';

      if (isServerMade) {
        void stopPlaybackSession(first.session.sessionId, clientId);
      }

      const picksItsOwnSound = mayPickSound && !isServerMade;
      const outcome = isServerMade ? await ask(audioStreamIndex) : first;

      if (outcome.kind === 'failed') {
        if (outcome.problem === 'unreachable') {
          reconnect();
        } else {
          stopAt(outcome.problem, outcome.reason);
        }

        return;
      }

      startedId =
        keptSource === undefined && outcome.session.delivery.kind !== 'direct'
          ? outcome.session.sessionId
          : null;

      if (isAbandoned()) {
        if (startedId !== null) {
          abandonStartedSession(startedId, clientId);
        }

        return;
      }
      setSessionMadeFor({
        isCast: request.isCast === true,
        burnInSubtitleId: request.burnInSubtitleId,
      });
      setSession(
        picksItsOwnSound && audioStreamIndex !== undefined
          ? {
              ...outcome.session,
              plan: {
                ...outcome.session.plan,
                audio: { ...outcome.session.plan.audio, streamIndex: audioStreamIndex },
              },
            }
          : outcome.session,
      );

      const { sessionId } = outcome.session;
      const isHls = outcome.session.delivery.kind !== 'direct';
      const convertInstead = (
        fault: { category: number; code?: number } | null,
        atSeconds = videoRef.current?.currentTime,
      ): boolean => {
        const next =
          keptSource === undefined
            ? whatToConvertNext({ plan: outcome.session.plan, converted: request.converted, fault })
            : null;

        if (next === null) {
          return false;
        }

        setRequest((asked) => ({
          ...asked,
          converted: next,
          startSeconds: Math.floor(atSeconds ?? asked.startSeconds),
        }));

        return true;
      };

      heartbeatInterval = setInterval(() => {
        if (isHls) {
          const current = videoRef.current;
          const playing = current !== null && !current.paused;

          void heartbeatPlaybackSession(sessionId, playing, clientId).then((answer) => {
            if (answer === 'gone') {
              reconnect();
            }
          });
        }
      }, HEARTBEAT_INTERVAL_MILLISECONDS);

      presenceHealthInterval = setInterval(() => {
        reportPresenceHeartbeat(clientId);
      }, PRESENCE_HEALTH_INTERVAL_MILLISECONDS);

      const element = videoRef.current;

      if (element === null) {
        return;
      }

      const seen: { from: number | null } = { from: null };
      noteProgress = () => {
        seen.from ??= element.currentTime;

        if (element.currentTime - seen.from > 1) {
          hasPlayedRef.current = true;
        }
      };
      element.addEventListener('timeupdate', noteProgress);
      progressOn = element;

      await settledRef.current;

      if (isAbandoned()) {
        return;
      }

      try {
        const heard =
          film?.audioStreams.findIndex(
            (stream) =>
              stream.index ===
              (picksItsOwnSound ? audioStreamIndex : outcome.session.plan.audio.streamIndex),
          ) ?? -1;
        const isTheEngines =
          outcome.session.delivery.kind === 'direct' &&
          engine !== null &&
          film !== null &&
          pictureRef.current !== null &&
          (picksItsOwnSound ||
            !isPlayedNatively(deviceProfile, {
              container: film.container,
              videoCodec: film.videoCodec,
              audioCodec: film.audioStreams[Math.max(heard, 0)]?.codec ?? '',
            }));
        const route =
          engine === null || film === null
            ? null
            : chooseBrowserRoute(film, engine, window.matchMedia('(dynamic-range: high)').matches);

        if (
          isTheEngines &&
          route !== null &&
          outcome.session.delivery.kind === 'direct' &&
          pictureRef.current !== null
        ) {
          const handOver = () => {
            if (isAbandoned()) {
              return;
            }

            engineRefusedRef.current = true;
            setRequest((asked) => ({
              ...asked,
              startSeconds: Math.floor(videoRef.current?.currentTime ?? asked.startSeconds),
            }));
          };
          const toPlay = {
            element,
            url: outcome.session.delivery.url,
            startSeconds: request.startSeconds,
            audioTrackAt: Math.max(heard, 0),
            onFault: handOver,
          };

          setIsDrawnByTheEngine(route === 'webgpu');

          const attached = await (
            route === 'webgpu'
              ? attachEngine({
                  ...toPlay,
                  canvas: pictureRef.current,
                  brightness: hdrBrightnessRef.current,
                })
              : attachRemux(toPlay)
          ).catch(() => null);

          if (attached === null) {
            if (!isAbandoned()) {
              engineRefusedRef.current = true;
              setRequest((asked) => ({ ...asked }));
            }

            return;
          }

          if (isAbandoned()) {
            void attached.detach();

            return;
          }

          const original = outcome.session.delivery.url;
          const copies = outcome.session.keptCopies;
          const isHdrScreen = window.matchMedia('(dynamic-range: high)').matches;
          const take = (playing: typeof attached) => {
            const shown = playing.readDelivered();
            const isDrawn = playing.readEngine().route === 'webgpu';

            enginePictureRef.current =
              isDrawn &&
              pictureRef.current !== null &&
              shown.width !== null &&
              shown.height !== null
                ? { canvas: pictureRef.current, width: shown.width, height: shown.height }
                : null;
            setEnginePicture(enginePictureRef.current);
            teardown = playing.detach;
            releaseRef.current = playing.detach;
            deliveredRef.current = playing.readDelivered;
            engineStatsRef.current = playing.readEngine;
            brightenRef.current = playing.setBrightness;
            estimatedRef.current = playing.readEstimatedKbps;
          };

          take(attached);
          setKeptSteps(copies.map((copy) => copy.quality));
          setCanSwitchCopies(true);
          switchCopyRef.current = async (rung) => {
            const copy = copies.find((one) => one.quality === rung) ?? null;
            const url = rung === 'original' ? original : copy?.url;
            const canvas = pictureRef.current;

            if (url === undefined || canvas === null || isAbandoned()) {
              return;
            }

            const at = element.currentTime;
            const wasPlaying = !element.paused;
            const copyRoute = copy === null ? route : chooseBrowserRoute(copy, engine, isHdrScreen);

            await teardown?.();

            const next = await (
              copyRoute === 'webgpu'
                ? attachEngine({
                    ...toPlay,
                    url,
                    startSeconds: at,
                    canvas,
                    brightness: hdrBrightnessRef.current,
                  })
                : attachRemux({ ...toPlay, url, startSeconds: at })
            ).catch(() => null);

            if (next === null) {
              handOver();

              return;
            }

            if (isAbandoned()) {
              void next.detach();

              return;
            }

            take(next);
            setIsDrawnByTheEngine(copyRoute === 'webgpu');
            setBrowserRung(rung);

            if (wasPlaying) {
              void element.play().catch(() => undefined);
            }
          };
        } else if (outcome.session.delivery.kind === 'direct') {
          const onRefused = () => {
            const code = element.error?.code;
            const isUnreadable =
              code === ELEMENT_COULD_NOT_DECODE || code === ELEMENT_COULD_NOT_READ;

            if (isAbandoned() || (isUnreadable && convertInstead(null))) {
              return;
            }

            if (keptSource !== undefined) {
              stopAt('downloadMissing', element.error?.message ?? null);

              return;
            }

            const decided = problemOfAFault(
              { from: 'element', code: code ?? null },
              hasPlayedRef.current,
            );

            if (decided === 'reconnect') {
              reconnect();
            } else {
              stopAt(decided, element.error?.message ?? null);
            }
          };

          element.addEventListener('error', onRefused, { once: true });
          teardown = () => {
            element.removeEventListener('error', onRefused);

            return Promise.resolve();
          };
          element.src = outcome.session.delivery.url;
        } else {
          const { plan } = outcome.session;
          const source = await cache
            .ensureQueryData(libraryQueries.detail(request.mediaId))
            .catch(() => null);
          const attached = await attachShaka({
            element,
            manifestUrl: manifestToLoad(outcome.session.delivery).url,
            startSeconds: request.startSeconds,
            buffer: bufferFor(
              plan.video.kind === 'transcode'
                ? plan.video.maxBitrateKbps
                : (source?.bitrateKbps ?? null),
            ),
            connections: readPlaybackPreferences().connections,
            onFault: (fault) => {
              if (fault.severity < CRITICAL || isAbandoned() || convertInstead(fault)) {
                return;
              }

              const decided = problemOfAFault(
                { from: 'engine', category: fault.category, code: fault.code },
                hasPlayedRef.current,
              );

              if (decided === 'reconnect') {
                reconnect();
              } else {
                stopAt(decided, `${fault.category.toString()}/${fault.code.toString()}`);
              }
            },
            onRecovered: (refusedAtSeconds) => {
              if (!isAbandoned()) {
                convertInstead(null, refusedAtSeconds);
              }
            },
          });

          if (isAbandoned()) {
            void attached.detach();

            return;
          }

          teardown = attached.detach;
          releaseRef.current = attached.detach;
          deliveredRef.current = attached.readDelivered;
          estimatedRef.current = attached.readEstimatedKbps;
          ladderRef.current = attached.readLadder;
        }

        if (
          request.startSeconds > 0 &&
          outcome.session.delivery.kind === 'direct' &&
          !isTheEngines
        ) {
          element.currentTime = request.startSeconds;
        }

        if (!isAbandoned()) {
          setState('playing');
          setPosition(element.currentTime);

          if (request.isCast !== true) {
            start(element, !isTheEngines);
          }

          const still = { frames: -1, at: 0, checks: 0 };

          pictureWatch = setInterval(() => {
            const quality =
              element.paused ||
              element.videoWidth === 0 ||
              document.visibilityState !== 'visible' ||
              !('getVideoPlaybackQuality' in element)
                ? null
                : element.getVideoPlaybackQuality();

            if (quality === null) {
              still.frames = -1;
              still.checks = 0;

              return;
            }

            const hasMoved = element.currentTime - still.at > STILL_PICTURE_MOVES_SECONDS;

            still.checks =
              quality.totalVideoFrames === still.frames && hasMoved ? still.checks + 1 : 0;
            still.frames = quality.totalVideoFrames;
            still.at = element.currentTime;

            if (still.checks < STILL_PICTURE_CHECKS) {
              return;
            }

            clearInterval(pictureWatch ?? undefined);

            if (!convertInstead(null, element.currentTime)) {
              stopAt(
                'damaged',
                say('client.playback.playbackProblems.thePictureStoppedWhileTheSound'),
              );
            }
          }, PICTURE_WATCH_MS);
        }
      } catch (error) {
        const engine = PlaybackEngineErrorSchema.safeParse(error);

        if (!engine.success) {
          stopAt('playerBroke', error instanceof Error ? error.message : null);

          return;
        }

        const fault = {
          category: engine.data.category,
          ...(engine.data.code === undefined ? {} : { code: engine.data.code }),
        };

        if (isAbandoned() || convertInstead(fault)) {
          return;
        }

        const decided = problemOfAFault({ from: 'engine', ...fault }, hasPlayedRef.current);

        if (decided === 'reconnect') {
          reconnect();
        } else {
          stopAt(
            decided,
            `${engine.data.category.toString()}/${(engine.data.code ?? 0).toString()}`,
          );
        }
      }
    };

    void run();

    return () => {
      controller.abort();
      window.removeEventListener('pagehide', onPageHide);
      clearInterval(startTimerRef.current ?? undefined);
      startTimerRef.current = null;
      clearInterval(heartbeatInterval ?? undefined);
      clearInterval(presenceHealthInterval ?? undefined);
      clearInterval(pictureWatch ?? undefined);
      stopWaiting?.();

      if (noteProgress !== null) {
        progressOn?.removeEventListener('timeupdate', noteProgress);
      }
      settledRef.current = Promise.resolve(teardown?.()).catch(() => undefined);
      releaseRef.current = null;

      if (startedId !== null) {
        void stopPlaybackSession(startedId, clientId);
      }
    };
  }, [
    request,
    start,
    reportPresenceHeartbeat,
    deviceProfile,
    media.id,
    media.durationSeconds,
    keptSource,
    rememberWhere,
    cache,
  ]);

  useEffect(
    () =>
      onPresenceEvent((event) => {
        const element = videoRef.current;

        if (event.kind === 'stopped') {
          element?.pause();
          setStoppedBy({ problem: 'stopped', cause: null, reason: event.reason });
          setState('failed');

          return;
        }

        if (event.kind === 'paused') {
          element?.pause();

          notify.say(event.reason, {
            id: ADMIN_NOTICE,
            where: PLAYER_TOASTS,
            staysUntilDismissed: true,
          });

          return;
        }

        if (event.kind === 'message') {
          notify.say(event.text, { where: PLAYER_TOASTS, staysUntilDismissed: true });

          return;
        }

        if (event.kind !== 'resumed') {
          return;
        }

        notify.forget(ADMIN_NOTICE);
        void element?.play();
      }),
    [],
  );

  useEffect(() => {
    if (session === null || isOfflineRef.current) {
      return;
    }

    void sendPresenceHeartbeat(platformInUse().thisClientId(), isPlaying);
  }, [isPlaying, session]);

  useEffect(() => holdWatching(platformInUse().thisClientId(), () => !isOfflineNow()), []);

  useEffect(() => {
    let abandoned = false;

    setTrickplay(null);
    setDetail(null);
    setSubtitleTracks([]);
    setSelectedSubtitleId(SUBTITLES_OFF);
    setSegments([]);
    setChapters([]);
    setSelectedAudioIndex(null);

    let askingAgain: ReturnType<typeof setTimeout> | null = null;

    const askForFrames = () => {
      void fetchTrickplay(media.id).then((found) => {
        if (abandoned) {
          return;
        }

        setTrickplay(found);

        if (found === null) {
          askingAgain = setTimeout(askForFrames, ASK_FOR_FRAMES_AGAIN_EVERY_MS);
        }
      });
    };

    if (keptDownloadId !== undefined) {
      void trickplayForAFile(keptDownloadId).then((kept) => {
        if (abandoned) {
          return;
        }

        if (kept !== null || isOffline) {
          setTrickplay(kept);
        } else {
          askForFrames();
        }
      });
    }

    if (isOffline) {
      return () => {
        abandoned = true;
      };
    }

    if (keptDownloadId === undefined) {
      askForFrames();
    }

    void cache
      .ensureQueryData(libraryQueries.detail(media.id))
      .catch(() => null)
      .then((found) => {
        if (!abandoned) {
          setDetail(found);
        }
      });

    void fetchSegments(media.id)
      .catch(() => [])
      .then((found) => {
        if (!abandoned) {
          setSegments(found);
        }
      });

    void fetchChapters(media.id)
      .catch(() => [])
      .then((found) => {
        if (!abandoned) {
          setChapters(found);
        }
      });

    void fetchSubtitleTracks(media.id)
      .catch(() => [])
      .then((found) => {
        if (abandoned) {
          return;
        }

        setSubtitleTracks(found);

        const remembered = readPlaybackPreferences().subtitleLanguage;

        if (remembered === SUBTITLES_OFF) {
          setSelectedSubtitleId(SUBTITLES_OFF);

          return;
        }

        const continuing = trackForLanguage(found, remembered);

        if (continuing !== null) {
          setSelectedSubtitleId(continuing.id);
        }
      });

    return () => {
      abandoned = true;

      if (askingAgain !== null) {
        clearTimeout(askingAgain);
      }
    };
  }, [media.id, cache, isOffline, keptDownloadId]);

  useEffect(() => {
    if (detail === null || session === null || subtitleTracks.length === 0) {
      return;
    }

    const alreadyDecided = defaultedForRef.current;

    if (alreadyDecided === session.sessionId) {
      return;
    }

    defaultedForRef.current = session.sessionId;

    if (readPlaybackPreferences().subtitleLanguage === SUBTITLES_OFF) {
      return;
    }

    const heard = detail.audioStreams.find(
      (stream) => stream.index === session.plan.audio.streamIndex,
    );
    const forced = defaultTrackId(subtitleTracks, heard?.language ?? null);

    setSelectedSubtitleId((current) => (current === SUBTITLES_OFF ? forced : current));
  }, [detail, session, subtitleTracks]);

  useEffect(() => {
    const chosen = session?.plan.audio.streamIndex;

    if (chosen === undefined || chosen === null) {
      return;
    }

    setSelectedAudioIndex(chosen);
  }, [session]);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onChange);

    return () => {
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, []);

  useEffect(() => {
    const element = videoRef.current;

    if (element !== null) {
      element.volume = gainFor(volume);
      element.muted = isMuted;
      applyVolumeBoost(element, boost);
    }

    if (isSilencedByPolicyRef.current) {
      return;
    }

    writePlaybackPreferences({ volume, isMuted, boost });
  }, [volume, isMuted, boost]);

  useEffect(() => {
    hdrBrightnessRef.current = hdrBrightness;
    brightenRef.current?.(hdrBrightness);

    const element = videoRef.current;

    if (element !== null) {
      element.style.filter =
        isToneMappedHere && !isDrawnByTheEngine && hdrBrightness !== 1
          ? `brightness(${hdrBrightness.toString()})`
          : '';
    }

    writePlaybackPreferences({ hdrBrightness });
  }, [hdrBrightness, isToneMappedHere, isDrawnByTheEngine]);

  useEffect(() => {
    const element = videoRef.current;

    if (element !== null) {
      element.playbackRate = playbackRate;
    }
  }, [playbackRate, session]);

  useEffect(() => {
    if (!isShowingStats) {
      return;
    }

    const sample = () => {
      const element = videoRef.current;

      if (element !== null) {
        setHealth(readPlaybackHealth(element, frameSkewRef.current));
        setDelivered(deliveredRef.current?.() ?? null);
        setEngineStats(engineStatsRef.current?.() ?? null);
      }
    };

    sample();

    const timer = setInterval(sample, HEALTH_INTERVAL_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isShowingStats]);

  useEffect(() => {
    if (!isPlaying) {
      setIsIdle(false);

      return;
    }

    const timer = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_MILLISECONDS);

    return () => {
      clearTimeout(timer);
    };
  }, [isPlaying, activity]);

  useEffect(() => {
    setIsResting(false);

    if (!isImmersive || isPlaying || state !== 'playing' || isMenuOpen || isShowingStats) {
      return;
    }

    const timer = setTimeout(() => {
      setIsResting(true);
    }, PAUSED_SCREEN_MILLISECONDS);

    return () => {
      clearTimeout(timer);
    };
  }, [isImmersive, isPlaying, activity, state, isMenuOpen, isShowingStats]);

  const duration = media.durationSeconds > 0 ? media.durationSeconds : reportedDuration;
  const reporter = useMemo(() => createProgressReporter(media.id), [media.id]);
  const reportReached = useCallback(
    (isLeaving = false) => {
      const reached = reachedRef.current;

      if (isOfflineRef.current || reached.mediaId !== media.id) {
        return Promise.resolve(false);
      }

      return reporter.report(
        { positionSeconds: reached.seconds, durationSeconds: duration, segments },
        { isLeaving },
      );
    },
    [reporter, media.id, duration, segments],
  );

  useEffect(() => {
    reportReachedRef.current = reportReached;
  }, [reportReached]);
  const playingEpisode = episodes.find((episode) => episode.id === media.id);
  const following =
    onSelectEpisode === undefined
      ? null
      : givenFollowing !== undefined
        ? givenFollowing
        : playingEpisode === undefined
          ? null
          : nextEpisode(episodes, playingEpisode);
  const isHeldAtTheEnd = heldAtTheEndOf === media.id;
  const isFadingOut = willCarryOn && following !== null && onSelectEpisode !== undefined;
  const leaving = isFadingOut ? fadeBeforeTheEnd(position, duration) : 1;
  const arriving = !isArriving
    ? 1
    : arrivedAt === null
      ? 0
      : fadeAfterTheStart(position - arrivedAt);
  const fade = Math.min(leaving, arriving);

  useEffect(() => {
    const element = videoRef.current;

    if (element !== null) {
      element.volume = gainFor(volume) * fade;
    }

    if (!isArriving) {
      fadedOutRef.current = fade < 1;
    }
  }, [fade, volume, isArriving]);

  useEffect(() => {
    if (!fadedOutRef.current) {
      return;
    }

    fadedOutRef.current = false;
    setArrivedAt(null);
    setIsArriving(true);
  }, [media.id]);

  useEffect(() => {
    if (isArriving && arrivedAt === null && isPlaying) {
      setArrivedAt(position);
    }

    if (isArriving && arrivedAt !== null && position - arrivedAt >= 1) {
      setIsArriving(false);
      setArrivedAt(null);
    }
  }, [isArriving, arrivedAt, isPlaying, position]);

  const togglePlay = useCallback(() => {
    const element = videoRef.current;

    if (element === null || state === 'failed') {
      return;
    }

    if (party !== undefined) {
      party.onCommand({
        kind: party.isPlaying ? 'pause' : 'play',
        atSeconds: element.currentTime,
      });

      return;
    }

    if (element.paused) {
      void element.play();

      return;
    }

    element.pause();
  }, [party, state]);

  const seek = useCallback(
    (seconds: number) => {
      const element = videoRef.current;

      if (element === null) {
        return;
      }

      seekedToTheEndRef.current = following !== null && hasReachedTheEnd(seconds, duration);

      if (isHeldAtTheEnd && !seekedToTheEndRef.current) {
        setHeldAtTheEndOf(null);

        if (playsOnFromTheEndRef.current && party === undefined) {
          void element.play().catch(() => {});
        }
      }

      if (party !== undefined) {
        party.onCommand({ kind: 'seek', atSeconds: seconds });

        return;
      }

      setPosition(seconds);

      element.currentTime = seconds;
    },
    [party, following, duration, isHeldAtTheEnd],
  );

  useNowPlaying({
    media,
    isPlaying,
    positionSeconds: position,
    durationSeconds: duration,
    onTogglePlay: togglePlay,
    onSeek: seek,
  });

  useDiscordPresence({
    media: { ...media, durationSeconds: duration },
    isPlaying,
    positionSeconds: position,
    isAllowed: whoIsWatching.data?.showsWhatIamWatching ?? false,
    settings: whoIsWatching.data?.discordPresence ?? DEFAULT_DISCORD_PRESENCE,
    party: party === undefined ? null : { id: party.id, size: party.members },
  });

  useEffect(() => {
    saveCaptionStyle(captionStyle);
  }, [captionStyle]);

  const selectedTrack = subtitleTracks.find((track) => track.id === selectedSubtitleId) ?? null;

  const fetchableTrack = selectedTrack?.delivery === 'burnIn' ? null : selectedTrack;

  const subtitleFetching = useSubtitleFetching(
    media.id,
    subtitleTracks,
    mayAdminister,
    (tracks, fetched) => {
      setSubtitleTracks(tracks);
      setSelectedSubtitleId(fetched.id);
      writePlaybackPreferences({ subtitleLanguage: fetched.language });
    },
  );

  const chooseSubtitle = useCallback(
    (trackId: string) => {
      setSelectedSubtitleId(trackId);

      const chosen = subtitleTracks.find((track) => track.id === trackId) ?? null;

      writePlaybackPreferences({
        subtitleLanguage: trackId === SUBTITLES_OFF ? SUBTITLES_OFF : (chosen?.language ?? null),
      });

      const wanted =
        chosen?.delivery === 'burnIn' && chosen.streamIndex !== null
          ? chosen.streamIndex
          : undefined;

      if (wanted === request.subtitleStreamIndex) {
        return;
      }

      hold(videoRef.current);

      setRequest({
        mediaId: request.mediaId,
        startSeconds: Math.floor(position),
        requestedQuality: request.requestedQuality,
        autoRung: request.autoRung,
        ...(request.audioStreamIndex === undefined
          ? {}
          : { audioStreamIndex: request.audioStreamIndex }),
        ...(wanted === undefined ? {} : { subtitleStreamIndex: wanted }),
        ...(request.converted === undefined ? {} : { converted: request.converted }),
        ...(request.isCast === true ? { isCast: true } : {}),
      });
    },
    [
      subtitleTracks,
      request.mediaId,
      request.requestedQuality,
      request.autoRung,
      request.audioStreamIndex,
      request.subtitleStreamIndex,
      request.converted,
      request.isCast,
      position,
      hold,
    ],
  );

  const availableQualitySteps = useMemo(
    () => (detail === null || keptSource !== undefined ? [] : listAvailableQualitySteps(detail)),
    [detail, keptSource],
  );
  const qualityStepsSavingNothing = useMemo(
    () => (detail === null ? [] : stepsThatSaveNothing({ media: detail, profile: deviceProfile })),
    [detail, deviceProfile],
  );

  const qualityStepCosts = useMemo(
    () => (detail === null ? {} : qualityStepCostsFor({ media: detail, profile: deviceProfile })),
    [detail, deviceProfile],
  );

  const autoSteps = useMemo(
    () => availableQualitySteps.filter((step) => !qualityStepsSavingNothing.includes(step)),
    [availableQualitySteps, qualityStepsSavingNothing],
  );

  const moveAutoRung = useCallback(
    (rung: AutoRung) => {
      const element = videoRef.current;

      hold(element);

      if (switchCopyRef.current !== null) {
        void switchCopyRef.current(rung);

        return;
      }

      setRequest((asked) => ({
        ...asked,
        startSeconds: Math.floor(element?.currentTime ?? asked.startSeconds),
        autoRung: rung,
      }));
    },
    [hold],
  );

  useEffect(() => {
    if (state !== 'playing') {
      return;
    }

    const read = () => {
      setLadder(ladderRef.current?.() ?? null);
    };

    read();

    const timer = setInterval(read, LADDER_READ_EVERY_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [state, session]);

  const isOnALadder = (ladder?.variants ?? 1) > 1;

  useAutoQuality({
    isOn:
      request.requestedQuality === 'auto' &&
      state === 'playing' &&
      keptSource === undefined &&
      !isOnALadder,
    videoRef,
    readEstimatedKbps: () => estimatedRef.current?.() ?? null,
    current: canSwitchCopies ? (browserRung ?? 'original') : request.autoRung,
    steps: canSwitchCopies ? keptSteps : autoSteps,
    sourceBitrateKbps: detail?.bitrateKbps ?? null,
    onChange: moveAutoRung,
  });

  const offerHere =
    following === null
      ? null
      : nextEpisodeOfferAt({ segments, positionSeconds: position, durationSeconds: duration });
  const isInTheEnd = offerHere !== null;
  const nextOffer =
    state === 'playing' && (nextHiddenFor !== media.id || isHeldAtTheEnd) ? offerHere : null;

  useEffect(() => {
    if (!isInTheEnd) {
      setNextHiddenFor(null);
    }
  }, [isInTheEnd]);
  const skippable =
    state === 'playing' && nextOffer === null ? skippableAt(segments, position) : null;

  const audioTracks = (keptSource === undefined ? (detail?.audioStreams ?? []) : []).map(
    (stream, position) => ({
      index: stream.index,
      label: describeAudioTrack(
        {
          index: stream.index,
          codec: stream.codec,
          channels: stream.channels,
          language: stream.language,
          title: stream.title,
          isAtmos: stream.isAtmos,
          isDefault: stream.isDefault,
        },
        position + 1,
      ),
    }),
  );

  const changeAudio = useCallback(
    (streamIndex: number) => {
      const element = videoRef.current;

      hold(element);

      const heard = detail?.audioStreams.find((stream) => stream.index === streamIndex);

      if (heard?.language !== undefined && heard.language !== null) {
        writePlaybackPreferences({ audioLanguage: heard.language });
      }

      setSelectedAudioIndex(streamIndex);
      setRequest({
        mediaId: request.mediaId,
        startSeconds: Math.floor(position),
        audioStreamIndex: streamIndex,
        requestedQuality: request.requestedQuality,
        autoRung: request.autoRung,
        ...(request.subtitleStreamIndex === undefined
          ? {}
          : { subtitleStreamIndex: request.subtitleStreamIndex }),
        ...(request.burnInSubtitleId === undefined
          ? {}
          : { burnInSubtitleId: request.burnInSubtitleId }),
        ...(request.converted === undefined ? {} : { converted: request.converted }),
        ...(request.isCast === true ? { isCast: true } : {}),
      });
    },
    [
      request.burnInSubtitleId,
      request.mediaId,
      request.requestedQuality,
      request.autoRung,
      request.subtitleStreamIndex,
      request.converted,
      request.isCast,
      position,
      hold,
      detail,
    ],
  );

  const changeQuality = useCallback(
    (quality: QualityPreference) => {
      const element = videoRef.current;

      hold(element);

      saveQualityPreference(quality);
      setRequest({
        mediaId: request.mediaId,
        startSeconds: Math.floor(position),
        requestedQuality: quality,
        autoRung: 'original',
        ...(request.audioStreamIndex === undefined
          ? {}
          : { audioStreamIndex: request.audioStreamIndex }),
        ...(request.subtitleStreamIndex === undefined
          ? {}
          : { subtitleStreamIndex: request.subtitleStreamIndex }),
        ...(request.burnInSubtitleId === undefined
          ? {}
          : { burnInSubtitleId: request.burnInSubtitleId }),
        ...(request.converted === undefined ? {} : { converted: request.converted }),
        ...(request.isCast === true ? { isCast: true } : {}),
      });
    },
    [
      request.burnInSubtitleId,
      request.mediaId,
      request.audioStreamIndex,
      request.subtitleStreamIndex,
      request.converted,
      request.isCast,
      position,
      hold,
    ],
  );

  useEffect(() => {
    if (state !== 'playing' || duration <= 0) {
      return;
    }

    const timer = setInterval(() => {
      void reportReached();
    }, REPORT_EVERY_MILLISECONDS);

    return () => {
      clearInterval(timer);
      void reportReached().then(() =>
        cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey }),
      );
    };
  }, [state, duration, reportReached, cache]);

  const stepFrame = useCallback((direction: number) => {
    const element = videoRef.current;

    if (element === null) {
      return;
    }

    element.pause();

    const at = element.currentTime + direction * frameSecondsRef.current;
    const last = Number.isFinite(element.duration) ? element.duration : at;

    element.currentTime = Math.min(Math.max(at, 0), last);
  }, []);

  const pendingSkipRef = useRef<{ target: number; timer: ReturnType<typeof setTimeout> } | null>(
    null,
  );

  const skip = useCallback(
    (delta: number) => {
      const pending = pendingSkipRef.current;
      const target = Math.min(Math.max((pending?.target ?? position) + delta, 0), duration);

      if (pending !== null) {
        clearTimeout(pending.timer);
      }

      setPosition(target);

      pendingSkipRef.current = {
        target,
        timer: setTimeout(() => {
          pendingSkipRef.current = null;
          seek(target);
        }, SKIPS_SETTLE_MILLISECONDS),
      };
    },
    [seek, position, duration],
  );

  useEffect(
    () => () => {
      if (pendingSkipRef.current !== null) {
        clearTimeout(pendingSkipRef.current.timer);
      }
    },
    [],
  );

  const skipRef = useRef(skip);

  useEffect(() => {
    skipRef.current = skip;
  });

  const lastTapRef = useRef<{ at: number; zone: TapZone } | null>(null);
  const pendingTapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const togglePlayRef = useRef(togglePlay);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
  });

  useEffect(
    () => () => {
      if (pendingTapRef.current !== null) {
        clearTimeout(pendingTapRef.current);
      }
    },
    [],
  );

  const forgetPendingTap = () => {
    if (pendingTapRef.current !== null) {
      clearTimeout(pendingTapRef.current);
      pendingTapRef.current = null;
    }
  };

  const onTapStage = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' || hasFinePointer()) {
        return;
      }

      const stage = stageRef.current;
      const now = Date.now();
      const last = lastTapRef.current;

      setIsIdle(false);
      setActivity((count) => count + 1);

      if (
        stage === null ||
        (event.target instanceof Node && controlsRef.current?.contains(event.target) === true)
      ) {
        lastTapRef.current = null;

        return;
      }

      const { left, width } = stage.getBoundingClientRect();
      const zone = tapZoneOf((event.clientX - left) / width, TAP_EDGE);
      const isAgain =
        last !== null && now - last.at < DOUBLE_TAP_MILLISECONDS && last.zone === zone;

      forgetPendingTap();
      lastTapRef.current = { at: now, zone };

      if (isAgain && zone !== 'middle') {
        skipRef.current(zone === 'back' ? -SKIP_SECONDS : SKIP_SECONDS);

        return;
      }

      if (zone === 'middle' && !isAgain) {
        pendingTapRef.current = setTimeout(() => {
          pendingTapRef.current = null;
          togglePlayRef.current();
        }, DOUBLE_TAP_MILLISECONDS);
      }
    },
    [setIsIdle, setActivity],
  );

  const isOnThePicture = (target: EventTarget | null) =>
    target instanceof Element &&
    (target === stageRef.current ||
      target instanceof HTMLVideoElement ||
      target instanceof HTMLCanvasElement ||
      target.matches('[data-slot="picture-cover"], [data-slot="episode-fade"]'));

  const onClickStage = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer() || event.detail !== 1 || !isOnThePicture(event.target)) {
      return;
    }

    forgetPendingTap();
    pendingTapRef.current = setTimeout(() => {
      pendingTapRef.current = null;
      togglePlayRef.current();
    }, DOUBLE_TAP_MILLISECONDS);
  };

  const onDoubleClickStage = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!hasFinePointer() || !isOnThePicture(event.target)) {
      return;
    }

    forgetPendingTap();
    toggleFullscreenRef.current();
  };

  const onLeaveStage = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!aLeaveWorthHiding(event.pointerType)) {
        return;
      }

      pointRef.current = null;
      setIsIdle(isPlaying);
    },
    [isPlaying],
  );

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;

    if (stage === null) {
      return;
    }

    const owner: FullscreenOwner = document;
    const target: FullscreenTarget = stage;
    const picture: FullscreenVideo | null = videoRef.current;

    if (isFullscreen) {
      if (owner.exitFullscreen === undefined) {
        picture?.webkitExitFullscreen?.();

        return;
      }

      void owner.exitFullscreen();

      return;
    }

    if (target.requestFullscreen === undefined) {
      picture?.webkitEnterFullscreen?.();

      return;
    }

    void target.requestFullscreen();
  }, [isFullscreen]);

  const toggleFullscreenRef = useRef(toggleFullscreen);

  useEffect(() => {
    toggleFullscreenRef.current = toggleFullscreen;
  });

  useEffect(() => {
    const controls = controlsRef.current;

    if (controls === null) {
      return;
    }

    const watching = new ResizeObserver(([seen]) => {
      const tall = Math.round(seen?.contentRect.height ?? 0);

      setControlsTall((was) => (was === tall ? was : tall));
    });

    watching.observe(controls);

    return () => {
      watching.disconnect();
    };
  }, []);

  const isBarUp = (!isIdle && !isResting) || isShowingStats || isMenuOpen || state === 'failed';
  const isBarUpRef = useRef(isBarUp);

  useEffect(() => {
    if (!isImmersive) {
      return undefined;
    }

    const root = document.documentElement;

    root.dataset['valenceWatching'] = isBarUp ? 'shown' : 'hidden';

    return () => {
      delete root.dataset['valenceWatching'];
    };
  }, [isImmersive, isBarUp]);

  useEffect(() => {
    isBarUpRef.current = isBarUp;
  });

  useEffect(() => {
    const element = videoRef.current;

    if (element === null || !('requestVideoFrameCallback' in element)) {
      return;
    }

    let handle = 0;
    let previous: number | null = null;

    const measure = (_now: number, metadata: { mediaTime: number }) => {
      if (previous !== null) {
        const gap = metadata.mediaTime - previous;

        if (gap > 0 && gap < 1) {
          frameSecondsRef.current = gap;
        }
      }

      const skew = metadata.mediaTime - element.currentTime;

      if (Math.abs(skew) < MOST_FRAME_SKEW_SECONDS) {
        frameSkewRef.current = skew;
      }

      previous = metadata.mediaTime;
      handle = element.requestVideoFrameCallback(measure);
    };

    handle = element.requestVideoFrameCallback(measure);

    return () => {
      element.cancelVideoFrameCallback(handle);
    };
  }, [session]);

  useEffect(() => {
    if (isImmersive) {
      stageRef.current?.focus({ preventScroll: true });
    }
  }, [isImmersive, media.id]);

  useEffect(() => {
    if (!isImmersive) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      setIsIdle(false);
      setActivity((count) => count + 1);

      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        target instanceof HTMLElement &&
        target.getAttribute('role') === 'slider'
      ) {
        return;
      }

      const shortcuts: Record<string, () => void> = {
        ' ': togglePlay,
        k: togglePlay,
        ArrowLeft: () => {
          skipRef.current(-SKIP_SECONDS);
        },
        ArrowRight: () => {
          skipRef.current(SKIP_SECONDS);
        },
        ',': () => {
          stepFrame(-1);
        },
        '.': () => {
          stepFrame(1);
        },
        j: () => {
          skipRef.current(-JUMP_SECONDS);
        },
        l: () => {
          skipRef.current(JUMP_SECONDS);
        },
        f: toggleFullscreen,
        m: () => {
          isSilencedByPolicyRef.current = false;
          setIsMuted((muted) => !muted);
        },
        c: () => {
          setSelectedSubtitleId((current) =>
            current === SUBTITLES_OFF
              ? (subtitleTracks.find((track) => track.delivery === 'text')?.id ?? SUBTITLES_OFF)
              : SUBTITLES_OFF,
          );
        },
      };

      const act = shortcuts[event.key.length === 1 ? event.key.toLowerCase() : event.key];

      if (act === undefined) {
        return;
      }

      event.preventDefault();
      act();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isImmersive, togglePlay, stepFrame, toggleFullscreen, subtitleTracks]);

  useEffect(() => {
    if (!isImmersive) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isImmersive, isFullscreen, onClose]);

  const finish = () => {
    if (hasFinishedRef.current) {
      return;
    }

    hasFinishedRef.current = true;
    onProgress?.(
      reachedRef.current.mediaId === media.id ? reachedRef.current.seconds : 0,
      duration,
    );

    if (seekedToTheEndRef.current) {
      playsOnFromTheEndRef.current = isPlaying;
      setHeldAtTheEndOf(media.id);

      return;
    }

    onEnded?.();
  };

  const playTheNext = () => {
    if (following === null || onSelectEpisode === undefined) {
      return;
    }

    hasFinishedRef.current = true;
    onProgress?.(duration, duration);
    onSelectEpisode(following);
  };

  const asItPlays = {
    onTimeUpdate: (seconds: number) => {
      reachedRef.current = { mediaId: media.id, seconds };

      if (pendingSkipRef.current === null) {
        setPosition(seconds);
      }

      setHeldFrame(null);
      onProgress?.(seconds, duration);

      if (!hasReachedTheEnd(seconds, duration)) {
        hasFinishedRef.current = false;

        return;
      }

      videoRef.current?.pause();
      finish();
    },
    onDurationChange: setReportedDuration,
    onPlayingChange: (playing: boolean) => {
      setIsPlaying(playing);

      if (!playing) {
        void reportReached();
      }
    },
    onBufferingChange: setIsBuffering,
    onEnded: finish,
  };

  useEffect(() => {
    castTimeRef.current = asItPlays.onTimeUpdate;
  });

  const theTitleBar = (
    <header
      data-slot="player-header"
      className={
        isImmersive
          ? `absolute inset-x-0 top-0 z-40 flex items-center gap-4 bg-gradient-to-b from-shade/70 to-transparent p-4 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-text transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none ${
              isBarUp ? 'translate-y-0' : 'pointer-events-none -translate-y-full'
            }`
          : 'flex items-center gap-4'
      }
    >
      <div className="w-24 shrink-0" aria-hidden />

      <h2
        className={`flex-1 truncate text-center text-lg font-medium ${
          isImmersive ? '' : 'text-text'
        }`}
      >
        {describePlaying(media)}
      </h2>

      <div className="flex w-24 shrink-0 justify-end">
        <Button
          isIconOnly
          variant="overlay"
          label={say('common.close')}
          onClick={onClose}
          size="md"
        >
          <Icon of={XIcon} size={20} />
        </Button>
      </div>
    </header>
  );

  return (
    <section
      className={isImmersive ? 'relative flex h-full flex-col' : 'flex flex-col gap-3'}
      onPointerMove={(event) => {
        const last = pointRef.current;

        if (last !== null && last.x === event.clientX && last.y === event.clientY) {
          return;
        }

        pointRef.current = { x: event.clientX, y: event.clientY };

        setIsIdle(false);
        setActivity((count) => count + 1);
      }}
      onPointerLeave={onLeaveStage}
    >
      {isImmersive ? null : theTitleBar}

      <div
        ref={stageRef}
        tabIndex={-1}
        onPointerUp={onTapStage}
        onClick={onClickStage}
        onDoubleClick={onDoubleClickStage}
        className={`${
          isImmersive
            ? 'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-shade'
            : 'relative overflow-hidden rounded-lg bg-shade'
        } ${isIdle && !isShowingStats && !isMenuOpen ? 'cursor-none' : 'cursor-default'} outline-none`}
      >
        {isImmersive ? theTitleBar : null}

        <ProblemScreen
          problem={
            state === 'failed' && stoppedBy !== null
              ? describePlaybackProblem(stoppedBy.problem, stoppedBy.reason)
              : null
          }
          details={
            stoppedBy === null
              ? ''
              : describeProblemDetails({
                  problem: stoppedBy.problem,
                  cause: stoppedBy.cause,
                  title: describePlaying(media),
                  positionSeconds: position,
                  how: session?.mode ?? null,
                  sessionId: session?.sessionId ?? null,
                  build: theBuildInfo(),
                })
          }
          onRetry={() => {
            setRequest((asked) => ({
              ...asked,
              startSeconds: Math.floor(videoRef.current?.currentTime ?? asked.startSeconds),
            }));
          }}
          onSignIn={() => {
            window.location.reload();
          }}
        />

        {state === 'reconnecting' ? (
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
            <span
              role="status"
              className="rounded-full border border-overlay-line bg-overlay px-4 py-2 text-sm font-medium text-on-scrim backdrop-blur-md"
            >
              {say('client.playback.playbackProblems.reconnecting')}
            </span>
          </div>
        ) : null}

        <VideoSurface
          label={media.title}
          videoRef={videoRef}
          className={isImmersive ? 'h-full w-full object-contain' : ''}
          {...(fetchableTrack === null
            ? {}
            : {
                textTrack: {
                  id: fetchableTrack.id,
                  label: fetchableTrack.label,
                  language: fetchableTrack.language ?? 'und',
                  src: subtitleTrackUrl(media.id, fetchableTrack.id),
                },
              })}
          isDrawnElsewhere
          {...asItPlays}
        />

        <PictureCanvas
          canvasRef={pictureRef}
          isShown={isDrawnByTheEngine}
          className="absolute inset-0 size-full"
        />

        <div
          data-slot="picture-cover"
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-shade/1 will-change-[opacity]"
        />

        <ContentAdvisory
          certification={detail?.metadata.certification ?? null}
          region={detail?.metadata.certificationRegion ?? null}
          advisories={detail?.metadata.advisories ?? null}
          isShown={isAdvising && advisedFor === media.id}
        />

        <div
          data-slot="episode-fade"
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-shade transition-opacity duration-300 ease-linear"
          style={{ opacity: 1 - fade }}
        />

        {fetchableTrack === null || !isStyledSubtitle(fetchableTrack.format) ? null : (
          <AssSubtitles
            video={videoRef}
            mediaId={media.id}
            trackId={fetchableTrack.id}
            offsetSeconds={subtitleOffset}
            picture={isDrawnByTheEngine ? enginePicture : null}
          />
        )}

        {fetchableTrack === null || isStyledSubtitle(fetchableTrack.format) ? null : (
          <SubtitleCues
            src={subtitleTrackUrl(media.id, fetchableTrack.id)}
            cuesSrc={subtitleCuesUrl(media.id, fetchableTrack.id)}
            atSeconds={position - subtitleOffset}
            video={videoRef}
            offsetSeconds={subtitleOffset}
            style={captionStyle}
            isLifted={isBarUp}
          />
        )}

        {!isPoppedOut ? null : (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-shade text-center">
            <Icon of={PictureInPictureIcon} size={32} tone="muted" />

            <p className="text-sm text-text-muted">
              {say('screens.videoPlayer.playingInAFloatingWindow')}
            </p>

            <Button variant="secondary" size="sm" onClick={popOut}>
              {say('screens.videoPlayer.bringItBack')}
            </Button>
          </div>
        )}

        <Toaster id={PLAYER_TOASTS} position="top-center" />

        {castState !== 'connected' ? null : (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-shade text-center">
            <Icon of={CastIcon} size={32} tone="muted" />

            <p className="text-sm text-text-muted">{say('common.playingOnAnotherDevice')}</p>

            <p className="max-w-xs text-xs text-text-muted/70">
              {say('screens.videoPlayer.theControlsBelowStillWorkStopping')}
            </p>
          </div>
        )}

        {heldFrame === null ? null : (
          <div
            role="presentation"
            className="pointer-events-none absolute inset-0 bg-shade bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heldFrame.url})` }}
          />
        )}

        {!isSayingSo ? null : (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3',
              'animate-in fade-in-0 duration-[var(--duration-base)] ease-[var(--ease-out)]',
              'motion-reduce:duration-[var(--duration-instant)]',
            )}
          >
            <Spinner
              label={
                party?.isHeld === true
                  ? waitingWord(party.waitingFor)
                  : say(WAITING_FOR_MORE[whatIsPlaying(media)])
              }
              size="lg"
            />

            <p className="valence-solid rounded-md px-4 py-1.5 text-sm text-text">
              {party?.isHeld === true
                ? waitingWord(party.waitingFor)
                : say(WAITING_FOR_MORE[whatIsPlaying(media)])}
            </p>
          </div>
        )}

        {state === 'starting' ? (
          <div
            className={
              heldFrame === null
                ? 'pointer-events-none absolute inset-0 flex items-center justify-center'
                : 'pointer-events-none absolute right-3 top-3 rounded-full bg-shade/60 p-2 text-text'
            }
          >
            <Spinner
              label={
                heldFrame === null
                  ? say('screens.videoPlayer.preparingPlayback')
                  : heldFrame.isItemChange
                    ? say('screens.videoPlayer.loadingTheNextEpisode')
                    : say('screens.videoPlayer.changingTheStream')
              }
              size={heldFrame === null ? 'lg' : 'sm'}
            />
          </div>
        ) : null}

        {isShowingStats ? (
          <motion.div
            drag
            dragControls={statsDrag}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={stageRef}
            className="pointer-events-none absolute left-3 top-16 z-50 w-[min(32rem,calc(100%-1.5rem))]"
          >
            <StreamStats
              onGrab={(event) => {
                statsDrag.start(event);
              }}
              media={media}
              session={session}
              detail={detail}
              health={health}
              delivered={delivered}
              engine={engineStats}
              sessionStartSeconds={request.startSeconds}
              {...(party === undefined
                ? {}
                : {
                    party: {
                      isPlaying: party.isPlaying,
                      isHeld: party.isHeld,
                      waitingFor: party.waitingFor,
                      referenceSeconds: party.referenceSeconds,
                      jitterMs: party.jitterMs,
                      members: party.members,
                    },
                  })}
              onClose={() => {
                setIsShowingStats(false);
              }}
            />
          </motion.div>
        ) : null}

        <div
          className="absolute right-[calc(0.75rem+env(safe-area-inset-right,0px))] z-10 flex flex-col items-end gap-3 transition-[bottom] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{
            bottom: isBarUp
              ? `calc(${(controlsTall + CLEAR_OF_THE_CONTROLS * 2).toString()}px + env(safe-area-inset-bottom, 0px))`
              : CLEAR_OF_THE_EDGE,
          }}
        >
          {skippable === null ? null : (
            <Button
              size="xl"
              variant="overlay"
              className="px-7"
              onClick={() => {
                seek(skippable.endSeconds);
              }}
            >
              {describeSkip(skippable)}
              <Icon of={SkipForwardFilledIcon} size={20} />
            </Button>
          )}

          <AnimatePresence>
            {nextOffer === null || following === null || isMenuOpen ? null : (
              <NextEpisodeCard
                key={following.id}
                episode={following}
                offer={nextOffer}
                isCounting={willCarryOn && !isHeldAtTheEnd}
                onPlay={playTheNext}
                onWatchCredits={() => {
                  setNextHiddenFor(media.id);
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <div
          ref={controlsRef}
          className={`absolute z-[15] bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-[calc(0.75rem+env(safe-area-inset-left,0px))] right-[calc(0.75rem+env(safe-area-inset-right,0px))] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none ${
            isBarUp ? 'translate-y-0' : 'pointer-events-none translate-y-[calc(100%_+_1.5rem)]'
          }`}
        >
          <PlayerControls
            segments={segments}
            chapters={chapters}
            fetchableSubtitles={subtitleFetching.offered}
            fetchingSubtitle={subtitleFetching.fetching}
            onFetchSubtitle={(code) => {
              void subtitleFetching.fetchIn(code);
            }}
            {...(mayAdminister
              ? {
                  onFindSubtitles: () => {
                    setIsFindingSubtitles(true);
                  },
                }
              : {})}
            {...(renderPartyMenu === undefined
              ? {}
              : {
                  partyMenu: renderPartyMenu({
                    isHidden: !isBarUp,
                    onOpenChange: setIsMenuOpen,
                  }),
                })}
            title={media.title}
            playingId={media.id}
            episodes={episodes}
            following={following}
            {...(onSelectEpisode === undefined ? {} : { onSelectEpisode })}
            {...(watchedFractionFor === undefined ? {} : { watchedFractionFor })}
            isPlaying={isPlaying}
            position={position}
            duration={duration}
            volume={volume}
            boost={boost}
            onBoostChange={setBoost}
            {...(isToneMappedHere
              ? { hdrBrightness, onHdrBrightnessChange: setHdrBrightness }
              : {})}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            isShowingStats={isShowingStats}
            playbackRate={playbackRate}
            subtitleTracks={subtitleTracks}
            selectedSubtitleId={selectedSubtitleId}
            audioTracks={audioTracks}
            selectedAudioIndex={selectedAudioIndex}
            availableQualitySteps={availableQualitySteps}
            originalLabel={detail === null ? say('common.original') : originalLabel(detail)}
            qualityStepsSavingNothing={qualityStepsSavingNothing}
            qualityStepCosts={qualityStepCosts}
            selectedQuality={request.requestedQuality}
            autoRung={
              isOnALadder && typeof ladder?.activeHeight === 'number'
                ? rungOfHeight(ladder.activeHeight)
                : (browserRung ?? request.autoRung)
            }
            isDisabled={state !== 'playing'}
            onTogglePlay={togglePlay}
            onSeek={seek}
            onSkip={skip}
            onPlaybackRateChange={setPlaybackRate}
            onSubtitleChange={chooseSubtitle}
            onAudioChange={changeAudio}
            onQualityChange={changeQuality}
            onMenuOpenChange={setIsMenuOpen}
            isShowingRemaining={isShowingRemaining}
            onToggleTimeDisplay={() => {
              setIsShowingRemaining((showing) => {
                writePlaybackPreferences({ showsRemaining: !showing });

                return !showing;
              });
            }}
            captionStyle={captionStyle}
            onCaptionStyleChange={setCaptionStyle}
            onCaptionStyleReset={() => {
              setCaptionStyle(DEFAULT_CAPTION_STYLE);
            }}
            onVolumeChange={(next) => {
              setVolume(next);
              isSilencedByPolicyRef.current = false;
              setIsMuted(next === 0);
            }}
            onToggleMute={() => {
              isSilencedByPolicyRef.current = false;
              setIsMuted((muted) => !muted);
            }}
            onToggleFullscreen={toggleFullscreen}
            {...(hasTelevision
              ? {
                  onPlayOnTv: () => {
                    const element = videoRef.current;

                    element?.pause();
                    setSendingAt(element?.currentTime ?? 0);
                  },
                }
              : {})}
            castState={castState}
            onCast={() => {
              const element = videoRef.current;

              if (element === null) {
                return;
              }

              if (!isReachableOrigin(window.location.origin)) {
                notify.failed(say('screens.videoPlayer.openValenceAtItsAddressOn'), {
                  where: PLAYER_TOASTS,
                  id: CAST_NOTICE,
                });

                return;
              }

              notify.forget(CAST_NOTICE);

              const context = castContextRef.current;

              if (context !== null) {
                void context.requestSession().catch(() => {});

                return;
              }

              void promptForDevice(element).then((outcome) => {
                if (outcome === 'shown' || outcome === 'dismissed') {
                  return;
                }

                notify.failed(
                  window.location.protocol === 'https:'
                    ? say('screens.videoPlayer.thisBrowserOfferedNoDeviceSafari')
                    : say('screens.videoPlayer.thisBrowserOnlyCastsOverA'),
                  { where: PLAYER_TOASTS, id: CAST_NOTICE },
                );
              });
            }}
            {...(canPopOut ? { onPopOut: popOut } : {})}
            isPoppedOut={isPoppedOut}
            onToggleStats={() => {
              setIsShowingStats((showing) => !showing);
            }}
            subtitleOffsetSeconds={subtitleOffset}
            onSubtitleOffsetChange={setSubtitleOffset}
            renderPreview={(seconds: number) => (
              <TrickplayPreview
                trickplay={trickplay}
                seconds={seconds}
                segment={segmentAt(segments, seconds)}
              />
            )}
          />
        </div>

        {isImmersive && isFullscreen ? <PausedScreen media={media} isShown={isResting} /> : null}
      </div>

      {isImmersive && !isFullscreen ? <PausedScreen media={media} isShown={isResting} /> : null}

      <PlayOnDialog
        media={sendingAt === null ? null : { id: media.id, title: media.title }}
        startSeconds={sendingAt ?? 0}
        onClose={() => {
          setSendingAt(null);
        }}
        onSent={() => {
          setSendingAt(null);
          onClose();
        }}
      />

      <FindSubtitlesDialog
        media={isFindingSubtitles ? { id: media.id, name: media.title } : null}
        onClose={() => {
          setIsFindingSubtitles(false);
        }}
        onFetched={() => {
          void fetchSubtitleTracks(media.id)
            .catch(() => [])
            .then(setSubtitleTracks);
        }}
      />
    </section>
  );
};

VideoPlayer.displayName = 'VideoPlayer';

export { VideoPlayer };
