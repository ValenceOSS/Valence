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

type WantedFetch =
  | { kind: 'off' }
  | { kind: 'absent' }
  | { kind: 'looked'; added: number; upgraded: number };

type SubtitleFinder = {
  setup: () => Promise<SubtitleSetup>;
  change: (change: SubtitleSetupChange) => Promise<SubtitleSetup>;
  search: (mediaId: string, language: string) => Promise<FoundSubtitles | null>;
  fetch: (mediaId: string, choice: SubtitleChoice) => Promise<SubtitleFetch>;
  fetchWanted: (mediaId: string, own: readonly string[]) => Promise<WantedFetch>;
};

export type { SubtitleFetch, SubtitleFinder, WantedFetch };
