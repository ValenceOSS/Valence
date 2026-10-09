import type { SubtitleFinder } from './SubtitleFinder';

const NOT_SET_UP = {
  hasOpenSubtitlesKey: false,
  openSubtitlesUsername: '',
  hasOpenSubtitlesPassword: false,
  hasSubdlKey: false,
  languages: [],
};

const NO_SUBTITLE_FINDER: SubtitleFinder = {
  setup: () => Promise.resolve(NOT_SET_UP),
  change: () => Promise.resolve(NOT_SET_UP),
  search: () => Promise.resolve({ subtitles: [], isSetUp: false }),
  fetch: () => Promise.resolve({ kind: 'notSetUp' }),
};

export { NO_SUBTITLE_FINDER };
