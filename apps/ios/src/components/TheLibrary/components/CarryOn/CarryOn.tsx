import { AShelf } from '@ValencePhone/components/AShelf/AShelf';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import { Button } from '@ValencePhone/components/Button/Button';
import type { CarryOnProps } from './CarryOn.types';

/**
 * What somebody was part way through, most recent first, as a row they scroll across.
 *
 * The first thing on the page, because it is the thing a person opening this is most likely to
 * want: they left something unfinished and have come back for it. Each carries the line saying
 * how far through it they got, which is what separates this row from every other one.
 *
 * Draws nothing at all where there is nothing to carry on with, rather than a heading over an
 * empty row — a new household has not watched anything yet, and should not be told so.
 *
 * @param items - What they were part way through.
 * @param howFarThrough - How much of each they have seen, as a fraction.
 * @param onLookAt - Told which one they want.
 */
const CarryOn = ({ items, howFarThrough, onLookAt }: CarryOnProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <AShelf title="Continue watching">
      {items.map((media) => (
        <Button
          key={media.id}
          tone="bare"
          label={media.title}
          onPress={() => {
            onLookAt(media.id);
          }}
        >
          <APoster
            title={media.title}
            year={media.year}
            artwork={theArtworkFor(media)}
            watched={howFarThrough(media.id)}
          />
        </Button>
      ))}
    </AShelf>
  );
};

CarryOn.displayName = 'CarryOn';

export { CarryOn };
