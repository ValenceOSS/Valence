import { FolderOpen as FolderOpenIcon, Search as SearchIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import type { EmptyLibraryProps } from './EmptyLibrary.types';
import { say } from '@ValenceI18n/say';

/**
 * Says why there is nothing on screen, which is three different situations and three different
 * answers: a search that matched nothing, one library that is empty while others are not, and a
 * server with nothing scanned anywhere. Only the last is a reason to talk about scanning.
 *
 * @param search - What was searched for, where anything was.
 * @param libraryName - The library being looked at, where one is chosen.
 * @param hasContentElsewhere - Whether any other library has anything in it.
 * @param canManage - Whether whoever is reading this could do anything about it.
 * @param onManage - Told that they would like to, where they can.
 */
const EmptyLibrary = ({
  search,
  libraryName,
  hasContentElsewhere,
  canManage = false,
  onManage,
}: EmptyLibraryProps) => {
  if (search !== '') {
    return (
      <NothingHere
        of={SearchIcon}
        title={say('common.nothingMatches', { query: search })}
        detail={say('screens.emptyLibrary.searchDetail')}
      />
    );
  }

  return (
    <NothingHere
      of={FolderOpenIcon}
      title={
        hasContentElsewhere
          ? libraryName === null
            ? say('screens.emptyLibrary.thisLibraryEmpty')
            : say('screens.emptyLibrary.libraryEmpty', { library: libraryName })
          : say('screens.emptyLibrary.nothingScanned')
      }
      detail={
        canManage ? say('screens.emptyLibrary.scanOrAdd') : say('screens.emptyLibrary.askAdmin')
      }
      {...(onManage === undefined
        ? {}
        : {
            action: (
              <Button variant="glossy" onClick={onManage}>
                {say('screens.emptyLibrary.scanIt')}
              </Button>
            ),
          })}
    />
  );
};

EmptyLibrary.displayName = 'EmptyLibrary';

export { EmptyLibrary };
