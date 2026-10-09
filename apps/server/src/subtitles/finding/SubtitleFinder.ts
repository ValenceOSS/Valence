import type {
  FoundSubtitles,
  SubtitleChoice,
  SubtitleSetup,
  SubtitleSetupChange,
} from '@ValenceContracts/schemas/SubtitleFinding';

type SubtitleFetch =
  | { kind: 'fetched'; name: string }
  | { kind: 'absent' }
  | { kind: 'notSetUp' }
  | { kind: 'unavailable' }
  | { kind: 'otherEpisode' }
  | { kind: 'readOnly' }
  | { kind: 'denied' }
  | { kind: 'failed' };

type SubtitleFinder = {
  setup: () => Promise<SubtitleSetup>;
  change: (change: SubtitleSetupChange) => Promise<SubtitleSetup>;
  search: (mediaId: string, language: string) => Promise<FoundSubtitles | null>;
  fetch: (mediaId: string, choice: SubtitleChoice) => Promise<SubtitleFetch>;
};

export type { SubtitleFetch, SubtitleFinder };
