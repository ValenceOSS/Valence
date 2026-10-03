import type { FulfillingArrAppKind, Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type { Library } from '@ValenceContracts/schemas/Library';
import { say } from '@ValenceI18n/say';

type FulfilmentForm = {
  appId: string;
  rootFolderPath: string;
  qualityProfileId: string;
  metadataProfileId: string;
  searchesOnAdd: boolean;
};

type ReadFulfilmentForm =
  | { fulfilment: Fulfilment | null; problem: null }
  | { fulfilment: null; problem: string };

const VALENCE = 'valence';

/**
 * Who fulfils a library's requests as the form opens: Valence where nobody else was chosen, or the
 * connected app the library hands them to, with what it chose there.
 *
 * @param library - The library.
 * @returns The form.
 */
const fulfilmentFormOf = (library: Pick<Library, 'fulfilment'> | null): FulfilmentForm => {
  const kept = library?.fulfilment ?? null;

  return kept === null
    ? {
        appId: VALENCE,
        rootFolderPath: '',
        qualityProfileId: '',
        metadataProfileId: '',
        searchesOnAdd: true,
      }
    : {
        appId: kept.appId,
        rootFolderPath: kept.rootFolderPath,
        qualityProfileId: kept.qualityProfileId.toString(),
        metadataProfileId: kept.metadataProfileId?.toString() ?? '',
        searchesOnAdd: kept.searchesOnAdd,
      };
};

/**
 * Reads who fulfils a library's requests, or says what is still to be chosen: a root folder and a
 * quality profile for any app, and a metadata profile too for Lidarr.
 *
 * @param form - The form as it stands.
 * @param kind - The kind of app the library's requests can go to.
 * @returns Who fulfils them — null for Valence — or what is missing.
 */
const readFulfilmentForm = (
  form: FulfilmentForm,
  kind: FulfillingArrAppKind | null,
): ReadFulfilmentForm => {
  if (form.appId === VALENCE || kind === null) {
    return { fulfilment: null, problem: null };
  }

  const qualityProfileId = Number.parseInt(form.qualityProfileId, 10);
  const metadataProfileId = Number.parseInt(form.metadataProfileId, 10);

  if (form.rootFolderPath === '' || Number.isNaN(qualityProfileId)) {
    return {
      fulfilment: null,
      problem: say('screens.adminArea.librarySettingsDialog.chooseARootFolderAndA'),
    };
  }

  if (kind === 'lidarr' && Number.isNaN(metadataProfileId)) {
    return {
      fulfilment: null,
      problem: say('screens.adminArea.librarySettingsDialog.chooseAMetadataProfileForLidarr'),
    };
  }

  return {
    fulfilment: {
      appId: form.appId,
      rootFolderPath: form.rootFolderPath,
      qualityProfileId,
      metadataProfileId: kind === 'lidarr' ? metadataProfileId : null,
      searchesOnAdd: form.searchesOnAdd,
    },
    problem: null,
  };
};

export type { FulfilmentForm };

export { VALENCE, fulfilmentFormOf, readFulfilmentForm };
