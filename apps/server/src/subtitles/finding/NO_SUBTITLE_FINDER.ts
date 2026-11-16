import type { SubtitleFinder } from './SubtitleFinder';

const NOT_SET_UP = {
  hasOpenSubtitlesKey: false,
  openSubtitlesUsername: '',
  hasOpenSubtitlesPassword: false,
  hasSubdlKey: false,
  languages: [],
  isAutomatic: false,
  filmMinimumScore: 70,
  episodeMinimumScore: 90,
  writesSubtitles: false,
  whisperModel: 'base' as const,
  whisperLanguage: null,
  translatesToEnglish: false,
  canWriteSubtitles: false,
};

const NO_SUBTITLE_FINDER: SubtitleFinder = {
  setup: () => Promise.resolve(NOT_SET_UP),
  change: () => Promise.resolve(NOT_SET_UP),
  finding: () => Promise.resolve({ state: 'notSetUp', sites: [], languages: [], server: null }),
  search: () => Promise.resolve({ subtitles: [], isSetUp: false }),
  fetch: () => Promise.resolve({ kind: 'notSetUp' }),
  fetchWanted: () => Promise.resolve({ kind: 'off' }),
};

export { NO_SUBTITLE_FINDER };
