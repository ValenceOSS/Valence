import type { ToneMappingCheck } from './ToneMappingCheck';

type EngineSupport = {
  videoCodecs: string[];
  tenBitVideoCodecs: string[];
  remuxVideoCodecs: string[];
  remuxTenBitVideoCodecs: string[];
  toneMappedCodecs: string[];
  toneMappingChecks: Partial<Record<string, ToneMappingCheck>>;
  audioCodecs: string[];
};

export type { EngineSupport };
