import { showIdOf } from '@ValenceClient/library/showIdOf';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { theArtworkFor } from '@ValencePhone/components/APoster/theArtworkFor';
import { Button } from '@ValencePhone/components/Button/Button';
import type { ACardProps } from './ACard.types';

/**
 * Something in the library as a poster, which opens its page when pressed.
 *
 * An episode standing for its programme, as it does on every shelf but the one of things somebody
 * is part way through, is named for the programme and opens it rather than the episode.
 *
 * @param media - What it is.
 * @param asProgramme - Whether an episode stands for its programme here.
 * @param watched - How much of it has been seen.
 * @param wide - How wide to draw it, where it fills a cell of a grid.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 */
const ACard = ({ media, asProgramme, watched = 0, wide, onLookAt, onLookAtShow }: ACardProps) => {
  const showId = asProgramme ? showIdOf(media) : null;
  const title = showId === null ? media.title : (media.seriesTitle ?? media.title);

  return (
    <Button
      tone="bare"
      label={title}
      onPress={() => {
        if (showId === null) {
          onLookAt(media.id);
        } else {
          onLookAtShow(media.libraryId, showId);
        }
      }}
    >
      <APoster
        title={title}
        year={showId === null ? media.year : null}
        artwork={theArtworkFor(media)}
        watched={showId === null ? watched : 0}
        {...(wide === undefined ? {} : { wide })}
      />
    </Button>
  );
};

ACard.displayName = 'ACard';

export { ACard };
