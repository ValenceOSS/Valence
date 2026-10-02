import type { ArrImportApplied, ArrWantedOutcome } from '@ValenceContracts/schemas/ArrImport';

type ArrImportOutcomeProps = {
  applied: ArrImportApplied;
  asked: ArrWantedOutcome & { done: number };
  isAsking: boolean;
};

export type { ArrImportOutcomeProps };
