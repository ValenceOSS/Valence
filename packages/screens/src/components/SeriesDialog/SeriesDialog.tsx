import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { BookRow } from '@ValenceScreens/components/BookRow/BookRow';
import type { SeriesDialogProps } from './SeriesDialog.types';

/**
 * A series of books opened from its card on the shelf: every book in it, in the order they are
 * read, each saying its place, and each opening as any book does.
 *
 * @param series - The series, or nothing while none is open.
 * @param onClose - Told to close it.
 * @param onOpen - Told which book was chosen.
 */
const SeriesDialog = ({ series, onClose, onOpen }: SeriesDialogProps) => {
  const authors = [...new Set((series?.books ?? []).flatMap((book) => book.authors ?? []))];

  return (
    <Dialog label={series?.name ?? 'A series'} isOpen={series !== null} onClose={onClose}>
      <DialogTitle
        size="compact"
        title={series?.name ?? ''}
        detail={[`${(series?.books.length ?? 0).toString()} books`, ...authors].join(' · ')}
      >
        <Button variant="ghost" size="sm" isIconOnly label="Close" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <DialogContent className="p-4 sm:p-6">
        {series === null ? null : (
          <BookRow title="In order" books={series.books} isNumbered onOpen={onOpen} />
        )}
      </DialogContent>
    </Dialog>
  );
};

SeriesDialog.displayName = 'SeriesDialog';

export { SeriesDialog };
