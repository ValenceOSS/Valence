import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { LibraryService } from '@ValenceServer/library/LibraryService';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type EveryTitleGateOptions = {
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  viewerOf: (headers: Headers) => Promise<Viewer | null>;
  library: Pick<LibraryService, 'refusedLibraries' | 'ceilingsFor'>;
};

/**
 * Makes the check for the title manager, which lists and edits titles across every library: it is
 * for somebody who may override titles and whom no administrator has kept from a library or held
 * to an age, since it shows them every library's titles whatever they were refused.
 *
 * @param options - How to tell what whoever is asking may do and see.
 * @returns Whether a request may use the title manager.
 */
const createEveryTitleGate =
  ({ requires, viewerOf, library }: EveryTitleGateOptions) =>
  async (headers: Headers): Promise<boolean> => {
    if (!(await requires(headers, 'media.override'))) {
      return false;
    }

    const viewer = await viewerOf(headers);

    if (viewer === null || viewer.kind !== 'account') {
      return false;
    }

    if (viewer.isAdministrator) {
      return true;
    }

    const [refused, ceilings] = await Promise.all([
      library.refusedLibraries(viewer.accountId),
      library.ceilingsFor(viewer.accountId),
    ]);

    return refused.length === 0 && ceilings.length === 0;
  };

export { createEveryTitleGate };
