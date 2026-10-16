import type { CastState } from '@ValenceScreens/playback/castPlayback.types';
import type { ReactNode } from 'react';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';
import type { AutoRung } from '@ValenceClient/playback/decideAutoQuality';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type AudioTrack = {
  index: number;
  label: string;
};

const SKIP_SECONDS = 10;

const BOOST_STEPS = [1, 1.5, 2, 3] as const;

type PlayerControlsProps = {
  title: string;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  boost: number;
  hdrBrightness?: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isShowingStats: boolean;
  playbackRate: number;
  subtitleTracks: SubtitleTrack[];
  fetchableSubtitles?: readonly { code: string; label: string }[];
  fetchingSubtitle?: string | null;
  onFetchSubtitle?: (code: string) => void;
  selectedSubtitleId: string;
  audioTracks: AudioTrack[];
  selectedAudioIndex: number | null;
  availableQualitySteps: QualityStepId[];
  originalLabel?: string;
  qualityStepsSavingNothing?: readonly QualityStepId[];
  qualityStepCosts?: Partial<Record<QualityPreference, string>>;
  selectedQuality: QualityPreference;
  autoRung?: AutoRung;
  isDisabled?: boolean;
  isLive?: boolean;
  liveDetail?: string;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (seconds: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onSubtitleChange: (trackId: string) => void;
  onAudioChange: (streamIndex: number) => void;
  onQualityChange: (quality: QualityPreference) => void;
  episodes?: MediaSummary[];
  following?: MediaSummary | null;
  playingId: string;
  onSelectEpisode?: (episode: MediaSummary) => void;
  watchedFractionFor?: (mediaId: string) => number | undefined;
  onMenuOpenChange?: (isOpen: boolean) => void;
  isShowingRemaining: boolean;
  onToggleTimeDisplay: () => void;
  captionStyle: CaptionStyle;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onCaptionStyleReset: () => void;
  onVolumeChange: (volume: number) => void;
  onBoostChange: (boost: number) => void;
  onHdrBrightnessChange?: (brightness: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleStats: () => void;
  subtitleOffsetSeconds?: number;
  onFindSubtitles?: () => void;
  onSubtitleOffsetChange?: (seconds: number) => void;
  castState?: CastState;
  onCast?: () => void;
  onPlayOnTv?: () => void;
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  renderPreview?: (seconds: number) => ReactNode;
  segments?: readonly MediaSegment[];
  chapters?: readonly VideoChapter[];
  partyMenu?: ReactNode;
};

export type { PlayerControlsProps };

export { SKIP_SECONDS, BOOST_STEPS };
