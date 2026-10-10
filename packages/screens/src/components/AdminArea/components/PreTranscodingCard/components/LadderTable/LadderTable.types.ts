import type {
  PreTranscodeTarget,
  PreTranscodeTargetProgress,
} from '@ValenceContracts/schemas/PreTranscoding';

type DraftRung = {
  id: string;
  target: PreTranscodeTarget;
  bitrate: string;
  progress: PreTranscodeTargetProgress | null;
  replacesOriginal: boolean;
};

type LadderTableProps = {
  rungs: readonly DraftRung[];
  onChange: (id: string, patch: Partial<PreTranscodeTarget>) => void;
  onBitrateChange: (id: string, bitrate: string) => void;
  onRemove: (id: string) => void;
  onReorder: (ids: string[]) => void;
};

export type { DraftRung, LadderTableProps };
