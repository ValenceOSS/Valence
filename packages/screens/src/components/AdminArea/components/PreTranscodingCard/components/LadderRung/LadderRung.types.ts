import type {
  PreTranscodeTarget,
  PreTranscodeTargetProgress,
} from '@ValenceContracts/schemas/PreTranscoding';

type LadderRungProps = {
  target: PreTranscodeTarget;
  bitrate: string;
  progress: PreTranscodeTargetProgress | null;
  isRemovable: boolean;
  onChange: (patch: Partial<PreTranscodeTarget>) => void;
  onBitrateChange: (bitrate: string) => void;
  onRemove: () => void;
};

export type { LadderRungProps };
