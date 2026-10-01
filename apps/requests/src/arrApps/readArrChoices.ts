import type { ArrAppChoices, FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrNamedListSchema } from '@ValenceRequests/arrApps/schemas/ArrNamedListSchema';
import { ArrRootFoldersSchema } from '@ValenceRequests/arrApps/schemas/ArrRootFoldersSchema';

/**
 * What a library handed to an app may choose from in it: its root folders, its quality profiles,
 * and for Lidarr its metadata profiles too.
 *
 * @param caller - How to ask the app.
 * @param kind - Which kind of app it is.
 * @returns The choices.
 */
const readArrChoices = async (
  caller: Pick<ArrCaller, 'read'>,
  kind: FulfillingArrAppKind,
): Promise<ArrAppChoices> => {
  const [rootFolders, qualityProfiles, metadataProfiles] = await Promise.all([
    caller.read('/rootfolder', ArrRootFoldersSchema),
    caller.read('/qualityprofile', ArrNamedListSchema),
    kind === 'lidarr' ? caller.read('/metadataprofile', ArrNamedListSchema) : Promise.resolve([]),
  ]);

  return {
    rootFolders: rootFolders.map((folder) => ({
      id: folder.id,
      path: folder.path,
      freeBytes: folder.freeSpace ?? null,
      isAccessible: folder.accessible,
    })),
    qualityProfiles,
    metadataProfiles,
  };
};

export { readArrChoices };
