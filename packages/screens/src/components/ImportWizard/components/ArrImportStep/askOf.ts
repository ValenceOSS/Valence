import { ARR_IMPORT_SOURCE_NAMES } from '@ValenceContracts/constants/ARR_IMPORT_SOURCE_NAMES';
import type {
  ArrImportAsk,
  ArrLibraryChoice,
  ArrPathMapping,
} from '@ValenceContracts/schemas/ArrImport';
import type { ArrSourceRow } from './ArrImportStep.types';
import { say } from '@ValenceI18n/say';

/**
 * What to ask the server for, from the import step's form: each app given both an address and a
 * key, every path mapping filled in on both sides, and the secrets and choices so far — or what is
 * missing, where an app has only one of the two or none is given at all.
 *
 * @param rows - The apps, as typed.
 * @param mappings - The path mappings, as typed.
 * @param secrets - Masked secrets typed in again.
 * @param choices - How each library is to be fulfilled.
 * @returns The ask, or what is missing.
 */
const askOf = (
  rows: readonly ArrSourceRow[],
  mappings: readonly ArrPathMapping[],
  secrets: Readonly<Record<string, string>>,
  choices: Readonly<Record<string, ArrLibraryChoice>>,
): { ask: ArrImportAsk; problem: null } | { ask: null; problem: string } => {
  const halfDone = rows.find((row) => (row.url.trim() === '') !== (row.apiKey.trim() === ''));

  if (halfDone !== undefined) {
    return {
      ask: null,
      problem: say('screens.importWizard.arrImportStep.giveNameAnAddressAndAKey', {
        name: ARR_IMPORT_SOURCE_NAMES[halfDone.kind],
      }),
    };
  }

  const sources = rows
    .filter((row) => row.url.trim() !== '')
    .map((row) => ({ kind: row.kind, url: row.url.trim(), apiKey: row.apiKey.trim() }));

  if (sources.length === 0) {
    return { ask: null, problem: say('screens.importWizard.arrImportStep.giveAtLeastOneApp') };
  }

  return {
    ask: {
      sources,
      pathMappings: mappings
        .map((mapping) => ({ from: mapping.from.trim(), to: mapping.to.trim() }))
        .filter((mapping) => mapping.from !== '' && mapping.to !== ''),
      secrets: Object.fromEntries(
        Object.entries(secrets).filter(([, value]) => value.trim() !== ''),
      ),
      choices: { ...choices },
    },
    problem: null,
  };
};

export { askOf };
