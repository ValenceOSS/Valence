import { useQueries, useQuery } from '@tanstack/react-query';
import { say } from '@ValenceI18n/say';
import { GalleryVerticalEnd as GalleryVerticalEndIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { NothingHere } from '@ValenceUI/NothingHere';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { BookRail } from '@ValenceScreens/components/BookRail/BookRail';
import type { BookShelfProps } from './BookShelf.types';

/**
 * Everything there is to read, a shelf at a time.
 *
 * One rail per library rather than one rail for everything, because a household that keeps its manga
 * and its novels apart did that on purpose and a single shelf would undo it.
 *
 * Given one library to keep to, it shows that shelf alone, so the navigation bar's choice of library
 * narrows the page; a library that is not a books library is ignored rather than leaving nothing.
 *
 * @param onOpen - Told which book somebody wants to read.
 * @param libraryId - One library to keep the page to, or nothing for every one.
 */
const BookShelf = ({ onOpen, onAddLibrary, libraryId = null }: BookShelfProps) => {
  const asked = useQuery(libraryQueries.all());
  const every = (asked.data ?? []).filter((library) => library.kind === 'books');
  const shelves = every.some((library) => library.id === libraryId)
    ? every.filter((library) => library.id === libraryId)
    : every;

  const onEachShelf = useQueries({
    queries: shelves.map((library) => bookQueries.inLibrary(library.id)),
  });

  const isCounting = onEachShelf.some((shelf) => shelf.data === undefined && !shelf.isError);
  const hasNothingOnAnyShelf =
    shelves.length > 0 &&
    !isCounting &&
    onEachShelf.every((shelf) => (shelf.data ?? []).length === 0);

  if (asked.data !== undefined && shelves.length === 0) {
    return (
      <NothingHere
        of={GalleryVerticalEndIcon}
        title={say('screens.bookShelf.noLibrariesTitle')}
        detail={
          onAddLibrary === undefined
            ? say('screens.bookShelf.noLibrariesAskAdmin')
            : say('screens.bookShelf.noLibrariesAddOne')
        }
        {...(onAddLibrary === undefined
          ? {}
          : {
              action: (
                <Button variant="glossy" onClick={onAddLibrary}>
                  {say('screens.bookShelf.addLibrary')}
                </Button>
              ),
            })}
      />
    );
  }

  if (hasNothingOnAnyShelf) {
    return (
      <NothingHere
        of={GalleryVerticalEndIcon}
        title={say('screens.bookShelf.nothingToReadTitle')}
        detail={
          onAddLibrary === undefined
            ? say('screens.bookShelf.nothingToReadAskAdmin')
            : say('screens.bookShelf.nothingToReadScan')
        }
        {...(onAddLibrary === undefined
          ? {}
          : {
              action: (
                <Button variant="glossy" onClick={onAddLibrary}>
                  {say('screens.bookShelf.scanIt')}
                </Button>
              ),
            })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {shelves.map((library) => (
        <BookRail key={library.id} libraryId={library.id} title={library.name} onOpen={onOpen} />
      ))}
    </div>
  );
};

BookShelf.displayName = 'BookShelf';

export { BookShelf };
