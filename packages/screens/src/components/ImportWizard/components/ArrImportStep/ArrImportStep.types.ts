import type {
  ArrImportApplied,
  ArrImportSourceKind,
  ArrPathMapping,
} from '@ValenceContracts/schemas/ArrImport';

type ArrSourceRow = { id: number; kind: ArrImportSourceKind; url: string; apiKey: string };

type ArrImportStepProps = {
  pathMappings?: readonly ArrPathMapping[];
  onDone?: (applied: ArrImportApplied) => void;
  onSkip?: () => void;
};

export type { ArrImportStepProps, ArrSourceRow };
