import type { Library } from '@ValenceContracts/schemas/Library';

type AddLibrariesStepProps = {
  libraries: readonly Library[] | null;
  scans: ReadonlyMap<string, string>;
  onRead: (libraries: Library[]) => void;
  onAdded: (library: Library, jobId: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
};

export type { AddLibrariesStepProps };
