import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bringBack } from '@ValenceClient/library/bringBack';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { failureOfThrown } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { pathInLibrary } from '@ValenceScreens/components/AdminArea/pathInLibrary';
import type { LeftOut } from '@ValenceContracts/schemas/LeftOut';
import type { LeftOutListProps } from './LeftOutList.types';
import { say } from '@ValenceI18n/say';

/**
 * The files and folders a library's scans pass over, each with why it was left out, and a way to
 * bring it back so the next scan reads it again.
 *
 * @param libraryId - The library.
 * @param libraryPath - Where the library is, so each path is shown from inside it.
 */
const LeftOutList = ({ libraryId, libraryPath }: LeftOutListProps) => {
  const cache = useQueryClient();
  const asked = useQuery(libraryQueries.leftOut(libraryId));
  const [returning, setReturning] = useState<string | null>(null);

  const back = async (leftOut: LeftOut) => {
    setReturning(leftOut.id);

    const failure = await failureOfThrown(() => bringBack(libraryId, leftOut.id));
    const shown = pathInLibrary(leftOut.path, libraryPath);

    setReturning(null);
    tellOutcome(say('screens.adminArea.leftOutList.pathIsBack', { path: shown }), failure);

    if (failure === null) {
      await cache.invalidateQueries({ queryKey: libraryQueries.leftOut(libraryId).queryKey });
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text">
        {say('screens.adminArea.leftOutList.leftOutOfThisLibrary')}
      </legend>

      <p className="text-xs text-text-muted">
        {say('screens.adminArea.leftOutList.filesAndFoldersThisLibrarysScans')}
      </p>

      {asked.isError ? (
        <p role="alert" className="text-sm text-danger">
          {say('screens.adminArea.leftOutList.whatIsLeftOutCouldNot')}
        </p>
      ) : asked.data === undefined ? null : asked.data.length === 0 ? (
        <p className="text-sm text-text-muted">
          {say('screens.adminArea.leftOutList.nothingIsLeftOut')}
        </p>
      ) : (
        <ul className="valence-well flex flex-col divide-y divide-[var(--surface-line)] rounded-xl">
          {asked.data.map((leftOut) => {
            const shown = pathInLibrary(leftOut.path, libraryPath);

            return (
              <li key={leftOut.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-text">{shown}</span>

                    {leftOut.isFolder ? (
                      <Badge size="sm">{say('screens.observabilityPage.jobHistory.folder')}</Badge>
                    ) : null}
                  </span>

                  {leftOut.note === null ? null : (
                    <span className="truncate text-xs text-text-muted">{leftOut.note}</span>
                  )}
                </span>

                <Button
                  variant="secondary"
                  size="xs"
                  label={say('screens.adminArea.leftOutList.bringPathBack', { path: shown })}
                  hasTooltip={false}
                  isLoading={returning === leftOut.id}
                  onClick={() => {
                    void back(leftOut);
                  }}
                >
                  {say('common.bringBack')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
};

LeftOutList.displayName = 'LeftOutList';

export { LeftOutList };
