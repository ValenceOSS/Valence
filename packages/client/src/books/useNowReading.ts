import { useCallback, useEffect } from 'react';
import { reportNowReading } from '@ValenceClient/books/bookDevices';

type ReadingPlace = { fraction: number | null; pageNumber: number | null };

/**
 * Tells the server which book this device has open to read, for as long as it is open, and where in
 * it somebody has got to each time that changes, so an administrator sees who is reading what.
 *
 * @param bookId - The book that is open, or nothing while none is.
 * @returns How to say where somebody has got to.
 */
const useNowReading = (bookId: string | null): ((place: ReadingPlace) => void) => {
  useEffect(() => {
    if (bookId === null) {
      return;
    }

    void reportNowReading({ bookId, fraction: null, pageNumber: null, reportedAtMs: Date.now() });

    return () => {
      void reportNowReading(null);
    };
  }, [bookId]);

  return useCallback(
    (place: ReadingPlace) => {
      if (bookId !== null) {
        void reportNowReading({ bookId, ...place, reportedAtMs: Date.now() });
      }
    },
    [bookId],
  );
};

export { useNowReading };
