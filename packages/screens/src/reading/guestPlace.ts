import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

const GuestPlaceSchema = z.object({
  chapterId: z.string(),
  pageNumber: z.number().int().nonnegative().nullable(),
  fraction: z.number().min(0).max(1).nullable(),
});

type GuestPlace = z.infer<typeof GuestPlaceSchema>;

/**
 * The key a shared book's place is kept under on this device.
 *
 * @param bookId - The book.
 * @returns The key.
 */
const keyFor = (bookId: string): string => `valence.shared.${bookId}`;

/**
 * Where a guest reading a shared book got to, kept on their own device.
 *
 * A guest has no profile to keep a place against, and a link is not an account: whoever holds it
 * might be anybody. So the place stays in the browser that read the book, and nothing about it is
 * sent anywhere — closing the page and coming back through the same link carries on.
 *
 * @param bookId - The book.
 * @returns Where they got to, or nothing where they have not opened it here before.
 */
const readGuestPlace = (bookId: string): GuestPlace | null => {
  const held = platformInUse().store.read(keyFor(bookId));

  try {
    const read = GuestPlaceSchema.safeParse(held === null ? null : JSON.parse(held));

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

/**
 * Keeps where a guest reading a shared book got to, on their own device.
 *
 * @param bookId - The book.
 * @param place - Where they are.
 */
const writeGuestPlace = (bookId: string, place: GuestPlace): void => {
  platformInUse().store.write(keyFor(bookId), JSON.stringify(place));
};

export type { GuestPlace };

export { readGuestPlace, writeGuestPlace };
