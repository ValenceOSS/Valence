import type { ReactNode } from 'react';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

type TypedStreamLimit = {
  bitrate: string;
  streams: string;
  quality: QualityStepId | null;
  limitsDownloads: boolean;
};

type StreamLimitCardProps = {
  typed: TypedStreamLimit;
  onChange: (typed: TypedStreamLimit) => void;
  children?: ReactNode;
};

export type { StreamLimitCardProps, TypedStreamLimit };
