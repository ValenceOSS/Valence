import { ARR_IMPORT_SOURCE_NAMES } from '@ValenceContracts/constants/ARR_IMPORT_SOURCE_NAMES';
import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { readArrSetup } from '@ValenceRequests/arrImport/readArrSetup';
import { arrFixture } from '@ValenceRequests/arrImport/testing/arrFixture';

/**
 * A Radarr, Sonarr or Lidarr's setup as it is read from one of the recorded apps.
 *
 * @param fixture - The recorded app, such as `radarr-v5`.
 * @param kind - Which kind of app it is.
 * @param url - Where it answers.
 * @param name - What it calls itself.
 * @returns Its setup.
 */
const aSetup = (
  fixture: string,
  kind: FulfillingArrAppKind,
  url: string,
  name: string = ARR_IMPORT_SOURCE_NAMES[kind],
): Promise<ArrSetup> => {
  const source = {
    kind,
    url,
    apiKey: `${kind}-key`,
    name,
    version: null,
    foundThrough: null,
    problem: null,
  };

  return readArrSetup(createArrCaller(aFakeArr(arrFixture(fixture)).fetch, source), kind, source);
};

export { aSetup };
