import { Icon } from '@ValenceUI/Icon';
import { motion, useDragControls } from 'motion/react';
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
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { VideoSurface } from '@ValenceUI/VideoSurface';
import { SubtitleCues } from '@ValenceScreens/components/SubtitleCues/SubtitleCues';
import { isTheDesktopClient } from '@ValenceScreens/desktop/theDesktopShell';
import { detectFromBrowser } from '@ValenceScreens/playback/detectDeviceProfile';
import { qualityStepCostsFor } from '@ValenceClient/playback/qualityStepCostsFor';
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
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DeliveredFormat } from '@ValenceScreens/playback/attachShaka';
import {
  describePlaybackFailure,
  PlaybackEngineErrorSchema,
} from '@ValenceClient/playback/describePlaybackFailure';
import {
  watchCastState,
  isReachableOrigin,
  promptForDevice,
  absoluteStreamUrl,
} from '@ValenceScreens/playback/castPlayback';
import { handOverToDevice } from '@ValenceScreens/playback/handOverToDevice';
import { loadCastSender, castStateOf, castStream } from '@ValenceScreens/playback/castSender';
import { applyVolumeBoost } from '@ValenceScreens/playback/volumeBoost';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { aLeaveWorthHiding } from '@ValenceScreens/playback/aLeaveWorthHiding';
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
} from '@ValenceScreens/playback/captionStyle';
import {
  readQualityPreference,
  saveQualityPreference,
} from '@ValenceClient/playback/qualityPreference';
import { fetchSegments, skippableAt, describeSkip } from '@ValenceClient/playback/fetchSegments';
import {
  reportWatchProgress,
  REPORT_EVERY_MILLISECONDS,
} from '@ValenceClient/playback/watchProgress';
import {
  readPlaybackPreferences,
  writePlaybackPreferences,
} from '@ValenceScreens/playback/playbackPreferences';
import { describeAudioTrack } from '@ValenceCore/functions/describeTrack';
import { listAvailableQualitySteps } from '@ValenceCore/functions/listAvailableQualitySteps';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { TrickplayPreview } from './components/TrickplayPreview/TrickplayPreview';
import { AmbientOrbs } from '@ValenceScreens/components/VideoPlayer/components/AmbientOrbs/AmbientOrbs';
import { useAmbientLights } from '@ValenceScreens/playback/useAmbientLights';
import { PlayerControls } from './components/PlayerControls/PlayerControls';
import { StreamStats } from './components/StreamStats/StreamStats';
import { cn } from '@ValenceUI/cn';
import { Toaster } from '@ValenceUI/Toaster';
import { notify } from '@ValenceUI/notify';
import { correctDrift } from '@ValenceCore/functions/correctDrift';
import { whatToReport } from '@ValenceCore/functions/whatToReport';
import { describeCommand } from '@ValenceClient/party/describeCommand';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { PoppedOut } from '@ValenceScreens/playback/popOutWithCaptions';
import type { CastState } from '@ValenceScreens/playback/castPlayback.types';
import { describePlaying } from './describePlaying';
import type { CastContext } from '@ValenceScreens/playback/castSender.types';
import { aKeptSession } from '@ValenceClient/downloads/aKeptSession';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import { subtitleCuesUrl } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { PlaybackHealth } from './components/StreamStats/StreamStats.types';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { PlayerState, VideoPlayerProps } from './VideoPlayer.types';
import { PlayOnDialog } from '@ValenceScreens/components/PlayOnDialog/PlayOnDialog';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
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

const IDLE_MILLISECONDS = 2500;

const DOUBLE_TAP_MILLISECONDS = 300;

const TAP_EDGE = 0.33;

const STALL_BEFORE_SAYING_SO_MS = 400;

const PLAYER_TOASTS = 'player';

const ASK_FOR_FRAMES_AGAIN_EVERY_MS = 10_000;

const ADMIN_NOTICE = 'admin-notice';

const PARTY_NOTICE = 'party-notice';

const CAST_NOTICE = 'cast-notice';

const JUMP_SECONDS = 30;

const CLEAR_OF_THE_CONTROLS = 12;

const CLEAR_OF_THE_EDGE = 24;

const FINISHED_WITHIN_SECONDS = 90;

const HEALTH_INTERVAL_MILLISECONDS = 500;

const PARTY_REPORT_EVERY_MS = 1000;

const CATCH_UP_BEYOND_SECONDS = 2;

const HAVE_METADATA = 1;

const LINE_UP_BEYOND_SECONDS = 0.05;

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
    return 'Getting the room in step';
  }

  return names.length === 1
    ? `Waiting for ${names[0] ?? ''}`
    : `Waiting for ${names.length.toString()} people`;
};

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
 * @param onStopped - Called when an administrator stops the stream, where that should leave somewhere
 *   other than where closing the player does; the reason is shown as a toast wherever it lands.
 * @param onProgress - Called as the viewer moves through it, with where they are and how long it is.
 * @param onEnded - Called when it reaches the end of its own accord.
 * @param episodes - The rest of the season, where this is one episode of a programme.
 * @param onSelectEpisode - Called with an episode the viewer chose instead of this one.
 * @param watchedFractionFor - How to ask how far through a given episode the viewer already is.
 * @param party - The watch party this viewing is part of, where it is part of one.
 * @param partyNotice - Something the party has to say, which may outlive the party itself.
 * @param renderPartyMenu - How to draw the watch party control in the bar, told when the bar has gone.
 * @param keptSource - Where a copy kept on this device is read from, which is played instead of asking
 * the server for a session.
 */
const VideoPlayer = ({
  media,
  isImmersive = false,
  startSeconds = 0,
  onClose,
  onStopped,
  onProgress,
  onEnded,
  episodes = [],
  onSelectEpisode,
  watchedFractionFor,
  party,
  partyNotice = null,
  renderPartyMenu,
  keptSource,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const statsDrag = useDragControls();
  const startTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSilencedByPolicyRef = useRef(false);
  const frameSecondsRef = useRef(DEFAULT_FRAME_SECONDS);
  const cache = useQueryClient();
  const [session, setSession] = useState<StartedSession | null>(null);
  const [state, setState] = useState<PlayerState>('starting');
  const [problem, setProblem] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const whoIsWatching = useQuery(profileQueries.watching());
  const [position, setPosition] = useState(0);
  const [reportedDuration, setReportedDuration] = useState(0);
  const [trickplay, setTrickplay] = useState<Trickplay | null>(null);
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const deviceProfile = useMemo(() => detectFromBrowser(platformInUse().describeThisClient()), []);
  const [volume, setVolume] = useState(() => readPlaybackPreferences().volume);
  const [boost, setBoost] = useState(() => readPlaybackPreferences().boost);
  const [isMuted, setIsMuted] = useState(() => readPlaybackPreferences().isMuted);
  const [isShowingRemaining, setIsShowingRemaining] = useState(
    () => readPlaybackPreferences().showsRemaining,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isShowingStats, setIsShowingStats] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lights = useAmbientLights(videoRef, isGlowing);
  const [health, setHealth] = useState<PlaybackHealth>(EMPTY_HEALTH);
  const [delivered, setDelivered] = useState<DeliveredFormat | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const pointRef = useRef<{ x: number; y: number } | null>(null);
  const [activity, setActivity] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState(SUBTITLES_OFF);
  const defaultedForRef = useRef<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState(readCaptionStyle);
  const [subtitleOffset, setSubtitleOffset] = useState(0);

  const [segments, setSegments] = useState<MediaSegment[]>([]);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number | null>(null);
  const [request, setRequest] = useState<{
    mediaId: string;
    startSeconds: number;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    requestedQuality: QualityPreference;
  }>({
    mediaId: media.id,
    startSeconds: Math.floor(startSeconds),
    requestedQuality: readQualityPreference(),
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
  const [sendingAt, setSendingAt] = useState<number | null>(null);
  const hasTelevision = useVideoDevices().some((device) => device.kind === 'tv');

  const [isBuffering, setIsBuffering] = useState(false);
  const [isSayingSo, setIsSayingSo] = useState(false);

  const appliedSequenceRef = useRef(-1);
  const hasCaughtUpRef = useRef(false);
  const partyRef = useRef(party);
  const stateRef = useRef<PlayerState>('starting');
  const lastGoodPositionRef = useRef(0);
  const frameSkewRef = useRef(0);

  useEffect(() => {
    const reference = party?.referenceSeconds ?? null;
    const element = videoRef.current;

    if (
      party === undefined ||
      reference === null ||
      element === null ||
      hasCaughtUpRef.current ||
      element.readyState < HAVE_METADATA
    ) {
      return;
    }

    hasCaughtUpRef.current = true;

    if (
      Math.abs(reference - element.currentTime - frameSkewRef.current) > CATCH_UP_BEYOND_SECONDS
    ) {
      element.currentTime = reference - frameSkewRef.current;
    }
  }, [party, party?.referenceSeconds, party?.meConnectionId]);

  useEffect(() => {
    const command = party?.command ?? null;
    const element = videoRef.current;

    if (command === null || element === null || command.sequence <= appliedSequenceRef.current) {
      return;
    }

    appliedSequenceRef.current = command.sequence;
    const said = describeCommand(command, party?.meConnectionId ?? null);

    if (said !== null) {
      notify.say(said, { where: PLAYER_TOASTS, id: PARTY_NOTICE });
    }

    if (command.command.kind !== 'changeWhatIsPlaying') {
      element.currentTime = command.command.atSeconds;
    }
  }, [party?.command, party?.meConnectionId]);

  useEffect(() => {
    const element = videoRef.current;

    if (party === undefined || element === null || state !== 'playing') {
      return;
    }

    const shouldRun = party.isPlaying && !party.isHeld;

    if (shouldRun && element.paused) {
      element.play().catch(() => {
        notify.say('Your browser will not start this on its own — press play to join in.', {
          where: PLAYER_TOASTS,
          id: PARTY_NOTICE,
        });
      });

      return;
    }

    if (!shouldRun && !element.paused) {
      element.pause();
    }
  }, [party, party?.isPlaying, party?.isHeld, state]);

  const hasStalled = state === 'playing' && (isBuffering || party?.isHeld === true);

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

  const isInAParty = party !== undefined;

  useEffect(() => {
    partyRef.current = party;
    stateRef.current = state;
  });

  useEffect(() => {
    if (!isInAParty) {
      return;
    }

    const timer = setInterval(() => {
      const element = videoRef.current;
      const held = partyRef.current;

      if (element === null || held === undefined) {
        return;
      }

      const ahead = bufferedAhead(element);

      const said = whatToReport({
        isSessionPlaying: stateRef.current === 'playing',
        frameSkewSeconds: frameSkewRef.current,
        readyState: element.readyState,
        currentSeconds: element.currentTime,
        lastGoodSeconds: lastGoodPositionRef.current,
        bufferedAheadSeconds: ahead,
        isPaused: element.paused,
      });

      lastGoodPositionRef.current = said.positionSeconds;

      held.onReport({ ...said, bufferedAheadSeconds: ahead });
    }, PARTY_REPORT_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isInAParty]);

  useEffect(() => {
    const reference = party?.referenceSeconds ?? null;

    if (party === undefined || reference === null) {
      return;
    }

    const element = videoRef.current;

    if (element === null || (element.paused && !party.isHeld)) {
      return;
    }

    const showing = element.currentTime + frameSkewRef.current;

    if (party.isHeld && element.paused) {
      if (Math.abs(reference - showing) > LINE_UP_BEYOND_SECONDS) {
        element.currentTime = reference - frameSkewRef.current;
      }

      return;
    }

    const corrected = correctDrift({
      behindByMs: (reference - showing) * 1000,
      jitterMs: party.jitterMs,
      isSeeking: element.seeking,
      isStalled: bufferedAhead(element) <= 0,
    });

    if (corrected.kind === 'snap') {
      element.currentTime = reference - frameSkewRef.current;
      element.playbackRate = 1;

      return;
    }

    if (element.paused) {
      return;
    }

    element.preservesPitch = true;
    element.playbackRate = corrected.kind === 'rate' ? corrected.rate : 1;
  }, [party, party?.referenceSeconds]);

  useEffect(() => {
    if (partyNotice !== null) {
      notify.say(partyNotice, { where: PLAYER_TOASTS });
    }
  }, [partyNotice]);
  const releaseRef = useRef<(() => Promise<void>) | null>(null);
  const deliveredRef = useRef<(() => DeliveredFormat | null) | null>(null);
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
      const withCaptions = Array.from(element.textTracks).some((track) => track.mode !== 'disabled')
        ? await popOutWithCaptions(element)
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

  useEffect(() => {
    if (castState !== 'connected') {
      return;
    }

    const element = videoRef.current;

    if (element === null || session === null) {
      return;
    }

    const address =
      session.delivery.kind === 'direct' ? session.delivery.url : session.delivery.manifestUrl;

    const context = castContextRef.current;

    if (context !== null) {
      const whole = absoluteStreamUrl(address, window.location.origin);

      if (whole !== null) {
        void castStream(context, {
          url: whole,
          title: media.title,
          startSeconds: element.currentTime,
        }).then((accepted) => {
          if (accepted) {
            element.pause();

            return;
          }

          notify.failed('That device would not take this stream.', { where: PLAYER_TOASTS });
        });
      }

      return;
    }

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
  }, [castState, session, media.title]);

  const wasCastingRef = useRef(false);

  const start = useCallback((element: HTMLVideoElement) => {
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

      if (attempts > START_ATTEMPTS || element.readyState > 0 || !element.paused) {
        clearInterval(startTimerRef.current ?? undefined);
        startTimerRef.current = null;

        return;
      }

      element.load();
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

    const element = videoRef.current;

    if (element === null || session === null || session.delivery.kind !== 'hls') {
      return;
    }

    const at = element.currentTime;

    void attachShaka({ element, manifestUrl: session.delivery.manifestUrl }).then((attached) => {
      releaseRef.current = attached.detach;
      deliveredRef.current = attached.readDelivered;
      element.currentTime = at;
      start(element);
    });
  }, [castState, session, start]);

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
    });
  }

  const reportPresenceHeartbeat = useCallback(
    (clientId: string) => {
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
    setState('starting');
    setProblem(null);
    setIsPlaying(false);
    setPosition(request.startSeconds);
    setReportedDuration(0);
    lastGoodPositionRef.current = request.startSeconds;

    const controller = new AbortController();
    const isAbandoned = () => controller.signal.aborted;
    let teardown: (() => Promise<void>) | null = null;
    let startedId: string | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let presenceHealthInterval: ReturnType<typeof setInterval> | null = null;
    const clientId = platformInUse().thisClientId();

    const onPageHide = () => {
      const element = videoRef.current;
      const reached = element?.currentTime ?? 0;
      const whole = element?.duration ?? Number.NaN;

      if (Number.isFinite(whole) && whole > 0 && reached > 0) {
        void reportWatchProgress(
          media.id,
          {
            positionSeconds: reached,
            durationSeconds: whole,
            isFinished: reached >= whole - FINISHED_WITHIN_SECONDS,
          },
          { isLeaving: true },
        );
      }

      if (startedId !== null) {
        void stopPlaybackSession(startedId, clientId, true);
      }

      void stopWatching(clientId, true);
    };

    window.addEventListener('pagehide', onPageHide);

    const run = async () => {
      const outcome =
        keptSource === undefined
          ? await startPlaybackSession(
              request.mediaId,
              deviceProfile,
              clientId,
              request.startSeconds,
              request.audioStreamIndex,
              request.requestedQuality,
              request.subtitleStreamIndex,
            )
          : ({ kind: 'started', session: aKeptSession(request.mediaId, keptSource) } as const);

      if (outcome.kind === 'failed') {
        if (!isAbandoned()) {
          setProblem(outcome.reason);
          setState('failed');
        }

        return;
      }

      startedId = keptSource === undefined ? outcome.session.sessionId : null;

      if (isAbandoned()) {
        if (startedId !== null) {
          abandonStartedSession(startedId, clientId);
        }

        return;
      }
      setSession(outcome.session);

      const { sessionId } = outcome.session;
      const isHls = outcome.session.delivery.kind !== 'direct';

      heartbeatInterval = setInterval(() => {
        if (isHls) {
          const current = videoRef.current;
          const playing = current !== null && !current.paused;

          void heartbeatPlaybackSession(sessionId, playing, clientId);
        }
      }, HEARTBEAT_INTERVAL_MILLISECONDS);

      presenceHealthInterval = setInterval(() => {
        reportPresenceHeartbeat(clientId);
      }, PRESENCE_HEALTH_INTERVAL_MILLISECONDS);

      const element = videoRef.current;

      if (element === null) {
        return;
      }

      await settledRef.current;

      if (isAbandoned()) {
        return;
      }

      try {
        if (outcome.session.delivery.kind === 'direct') {
          element.src = outcome.session.delivery.url;
        } else {
          const attached = await attachShaka({
            element,
            manifestUrl: outcome.session.delivery.manifestUrl,
            startSeconds: request.startSeconds,
            onFault: (fault) => {
              if (fault.severity < CRITICAL || isAbandoned()) {
                return;
              }

              setProblem(describePlaybackFailure(fault.category));
              setState('failed');
            },
          });

          teardown = attached.detach;
          releaseRef.current = attached.detach;
          deliveredRef.current = attached.readDelivered;
        }

        if (request.startSeconds > 0 && outcome.session.delivery.kind === 'direct') {
          element.currentTime = request.startSeconds;
        }

        if (!isAbandoned()) {
          setState('playing');

          start(element);
        }
      } catch (error) {
        if (!isAbandoned()) {
          const engine = PlaybackEngineErrorSchema.safeParse(error);

          setProblem(describePlaybackFailure(engine.success ? engine.data.category : null));
          setState('failed');
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
      settledRef.current = Promise.resolve(teardown?.()).catch(() => undefined);
      releaseRef.current = null;

      if (startedId !== null) {
        void stopPlaybackSession(startedId, clientId);
      }
    };
  }, [request, start, reportPresenceHeartbeat, deviceProfile, media.id, keptSource]);

  useEffect(
    () =>
      onPresenceEvent((event) => {
        const element = videoRef.current;

        if (event.kind === 'stopped') {
          element?.pause();

          notify.failed(event.reason, { id: ADMIN_NOTICE });

          (onStopped ?? onClose)();

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
          const said = notify.say(event.text, {
            where: PLAYER_TOASTS,
            staysUntilDismissed: true,
            action: {
              label: 'Dismiss',
              onPress: () => {
                notify.forget(said);
              },
            },
          });

          return;
        }

        if (event.kind !== 'resumed') {
          return;
        }

        notify.forget(ADMIN_NOTICE);
        void element?.play();
      }),
    [onClose, onStopped],
  );

  useEffect(() => {
    if (session === null) {
      return;
    }

    void sendPresenceHeartbeat(platformInUse().thisClientId(), isPlaying);
  }, [isPlaying, session]);

  useEffect(
    () => () => {
      void stopWatching(platformInUse().thisClientId());
    },
    [],
  );

  useEffect(() => {
    let abandoned = false;

    setTrickplay(null);
    setDetail(null);
    setSubtitleTracks([]);
    setSelectedSubtitleId(SUBTITLES_OFF);
    setSegments([]);
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

    askForFrames();

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
  }, [media.id, cache]);

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

  const duration = media.durationSeconds > 0 ? media.durationSeconds : reportedDuration;

  const togglePlay = useCallback(() => {
    const element = videoRef.current;

    if (element === null) {
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
  }, [party]);

  const seek = useCallback(
    (seconds: number) => {
      const element = videoRef.current;

      if (element === null) {
        return;
      }

      if (party !== undefined) {
        party.onCommand({ kind: 'seek', atSeconds: seconds });

        return;
      }

      setPosition(seconds);

      element.currentTime = seconds;
    },
    [party],
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
    party: party === undefined ? null : { id: party.id, size: party.members },
  });

  useEffect(() => {
    saveCaptionStyle(captionStyle);
  }, [captionStyle]);

  const selectedTrack = subtitleTracks.find((track) => track.id === selectedSubtitleId) ?? null;

  const fetchableTrack = selectedTrack?.delivery === 'burnIn' ? null : selectedTrack;

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
        ...(request.audioStreamIndex === undefined
          ? {}
          : { audioStreamIndex: request.audioStreamIndex }),
        ...(wanted === undefined ? {} : { subtitleStreamIndex: wanted }),
      });
    },
    [
      subtitleTracks,
      request.mediaId,
      request.requestedQuality,
      request.audioStreamIndex,
      request.subtitleStreamIndex,
      position,
      hold,
    ],
  );

  const availableQualitySteps = detail === null ? [] : listAvailableQualitySteps(detail);

  const qualityStepCosts = useMemo(
    () => (detail === null ? {} : qualityStepCostsFor({ media: detail, profile: deviceProfile })),
    [detail, deviceProfile],
  );

  const skippable = state === 'playing' ? skippableAt(segments, position) : null;

  const audioTracks = (detail?.audioStreams ?? []).map((stream, position) => ({
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
  }));

  const changeAudio = useCallback(
    (streamIndex: number) => {
      const element = videoRef.current;

      hold(element);

      setSelectedAudioIndex(streamIndex);
      setRequest({
        mediaId: request.mediaId,
        startSeconds: Math.floor(position),
        audioStreamIndex: streamIndex,
        requestedQuality: request.requestedQuality,
        ...(request.subtitleStreamIndex === undefined
          ? {}
          : { subtitleStreamIndex: request.subtitleStreamIndex }),
      });
    },
    [request.mediaId, request.requestedQuality, request.subtitleStreamIndex, position, hold],
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
        ...(request.audioStreamIndex === undefined
          ? {}
          : { audioStreamIndex: request.audioStreamIndex }),
        ...(request.subtitleStreamIndex === undefined
          ? {}
          : { subtitleStreamIndex: request.subtitleStreamIndex }),
      });
    },
    [request.mediaId, request.audioStreamIndex, request.subtitleStreamIndex, position, hold],
  );

  useEffect(() => {
    if (state !== 'playing' || duration <= 0) {
      return;
    }

    const report = () => {
      const element = videoRef.current;

      if (element === null) {
        return;
      }

      const at = element.currentTime;

      void reportWatchProgress(media.id, {
        positionSeconds: at,
        durationSeconds: duration,
        isFinished: at >= duration - FINISHED_WITHIN_SECONDS,
      });
    };

    const timer = setInterval(report, REPORT_EVERY_MILLISECONDS);

    return () => {
      clearInterval(timer);
      report();
    };
  }, [state, duration, media.id]);

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

  const skip = useCallback(
    (delta: number) => {
      seek(Math.min(Math.max(position + delta, 0), duration));
    },
    [seek, position, duration],
  );

  const skipRef = useRef(skip);

  useEffect(() => {
    skipRef.current = skip;
  });

  const lastTapRef = useRef<{ at: number; x: number } | null>(null);

  const onTapStage = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' || hasFinePointer()) {
        return;
      }

      const stage = stageRef.current;
      const now = Date.now();
      const last = lastTapRef.current;
      const near = last !== null && now - last.at < DOUBLE_TAP_MILLISECONDS;

      setIsIdle(false);
      setActivity((count) => count + 1);

      if (event.target instanceof Node && controlsRef.current?.contains(event.target) === true) {
        lastTapRef.current = null;

        return;
      }

      if (near && stage !== null) {
        const { left, width } = stage.getBoundingClientRect();
        const across = (event.clientX - left) / width;

        if (across <= TAP_EDGE) {
          skipRef.current(-SKIP_SECONDS);
        } else if (across >= 1 - TAP_EDGE) {
          skipRef.current(SKIP_SECONDS);
        }

        lastTapRef.current = null;

        return;
      }

      lastTapRef.current = { at: now, x: event.clientX };
    },
    [setIsIdle, setActivity],
  );

  const onLeaveStage = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      pointRef.current = null;

      if (!aLeaveWorthHiding(event.pointerType)) {
        return;
      }

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

  const isBarUp = !isIdle || isShowingStats || isMenuOpen;
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

      const shortcuts: Record<string, () => void> = {
        ' ': togglePlay,
        k: togglePlay,
        ArrowLeft: () => {
          stepFrame(-1);
        },
        ArrowRight: () => {
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
            current === SUBTITLES_OFF ? (subtitleTracks[0]?.id ?? SUBTITLES_OFF) : SUBTITLES_OFF,
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

  const asItPlays = {
    onTimeUpdate: (seconds: number) => {
      setPosition(seconds);
      setHeldFrame(null);
      onProgress?.(seconds, duration);
    },
    onDurationChange: setReportedDuration,
    onPlayingChange: setIsPlaying,
    onBufferingChange: setIsBuffering,
    onEnded: () => {
      onProgress?.(duration, duration);
      onEnded?.();
    },
  };

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
      <header
        data-slot="player-header"
        className={
          isImmersive
            ? `absolute inset-x-0 top-0 z-10 flex items-center gap-4 bg-gradient-to-b from-shade/70 to-transparent p-4 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] text-text transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none ${
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
          <Button isIconOnly variant="overlay" label="Close" onClick={onClose} size="md">
            <Icon of={XIcon} size={20} />
          </Button>
        </div>
      </header>

      <div
        className={
          isGlowing
            ? 'relative flex min-h-0 flex-1 items-center justify-center bg-shade p-[clamp(1rem,4vw,4rem)]'
            : 'contents'
        }
      >
        {isGlowing ? <AmbientOrbs lights={lights} /> : null}

        <div
          ref={stageRef}
          tabIndex={-1}
          onPointerUp={onTapStage}
          className={`${
            isGlowing
              ? 'relative flex aspect-video max-h-full w-full max-w-[90rem] items-center justify-center overflow-hidden rounded-2xl bg-shade shadow-[var(--shadow-overlay)]'
              : isImmersive
                ? 'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-shade'
                : 'relative overflow-hidden rounded-lg bg-shade'
          } ${isIdle && !isShowingStats && !isMenuOpen ? 'cursor-none' : 'cursor-default'} outline-none`}
        >
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

          {fetchableTrack === null ? null : (
            <SubtitleCues
              src={subtitleTrackUrl(media.id, fetchableTrack.id)}
              cuesSrc={subtitleCuesUrl(media.id, fetchableTrack.id)}
              atSeconds={position - subtitleOffset}
              style={captionStyle}
              isLifted={isBarUp}
            />
          )}

          {!isPoppedOut ? null : (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-shade text-center">
              <Icon of={PictureInPictureIcon} size={32} tone="muted" />

              <p className="text-sm text-text-muted">Playing in a floating window</p>

              <Button variant="secondary" size="sm" onClick={popOut}>
                Bring it back
              </Button>
            </div>
          )}

          <Toaster id={PLAYER_TOASTS} position="top-center" />

          {castState !== 'connected' ? null : (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-shade text-center">
              <Icon of={CastIcon} size={32} tone="muted" />

              <p className="text-sm text-text-muted">Playing on another device</p>

              <p className="max-w-xs text-xs text-text-muted/70">
                The controls below still work. Stopping the cast from the device brings it back
                here.
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
                    : `Waiting for more of ${whatIsPlaying(media)}`
                }
                size="lg"
              />

              <p className="valence-solid rounded-md px-4 py-1.5 text-sm text-text">
                {party?.isHeld === true
                  ? waitingWord(party.waitingFor)
                  : `Waiting for more of ${whatIsPlaying(media)}`}
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
                    ? 'Preparing playback'
                    : heldFrame.isItemChange
                      ? 'Loading the next episode'
                      : 'Changing the stream'
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
              className="pointer-events-none absolute left-3 top-16 w-[min(32rem,calc(100%-1.5rem))]"
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

          {skippable === null ? null : (
            <div
              className="absolute right-6 z-10 transition-[bottom] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none"
              style={{
                bottom: isBarUp
                  ? controlsTall + CLEAR_OF_THE_EDGE + CLEAR_OF_THE_CONTROLS
                  : CLEAR_OF_THE_EDGE,
              }}
            >
              <Button
                size="lg"
                variant="secondary"
                className="px-6"
                onClick={() => {
                  seek(skippable.endSeconds);
                }}
              >
                {describeSkip(skippable)}
                <Icon of={SkipForwardFilledIcon} size={18} />
              </Button>
            </div>
          )}

          <div
            ref={controlsRef}
            className={`absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-[calc(0.75rem+env(safe-area-inset-left,0px))] right-[calc(0.75rem+env(safe-area-inset-right,0px))] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none ${
              isBarUp ? 'translate-y-0' : 'pointer-events-none translate-y-[calc(100%_+_1.5rem)]'
            }`}
          >
            <PlayerControls
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
              {...(onSelectEpisode === undefined ? {} : { onSelectEpisode })}
              {...(watchedFractionFor === undefined ? {} : { watchedFractionFor })}
              isPlaying={isPlaying}
              position={position}
              duration={duration}
              volume={volume}
              boost={boost}
              onBoostChange={setBoost}
              isMuted={isMuted}
              isFullscreen={isFullscreen}
              isShowingStats={isShowingStats}
              isGlowing={isGlowing}
              {...(isImmersive
                ? {
                    onToggleGlow: () => {
                      setIsGlowing((glowing) => !glowing);
                    },
                  }
                : {})}
              playbackRate={playbackRate}
              subtitleTracks={subtitleTracks}
              selectedSubtitleId={selectedSubtitleId}
              audioTracks={audioTracks}
              selectedAudioIndex={selectedAudioIndex}
              availableQualitySteps={availableQualitySteps}
              qualityStepCosts={qualityStepCosts}
              selectedQuality={request.requestedQuality}
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
                  notify.failed(
                    'Open Valence at its address on the network rather than as localhost, so a device has somewhere to fetch from.',
                    { where: PLAYER_TOASTS, id: CAST_NOTICE },
                  );

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
                      ? 'This browser offered no device. Safari casts to AirPlay receivers; Chrome needs the extension that backs casting.'
                      : 'This browser only casts over a secure connection. Serve Valence over HTTPS, or use Safari, which will cast from here as it is.',
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
                <TrickplayPreview trickplay={trickplay} seconds={seconds} />
              )}
            />
          </div>
        </div>
      </div>

      {state === 'failed' ? (
        <p role="alert" className="text-sm text-danger">
          {problem ?? 'Playback failed.'}
        </p>
      ) : null}

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
    </section>
  );
};

VideoPlayer.displayName = 'VideoPlayer';

export { VideoPlayer };
