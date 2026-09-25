import { showIdOf } from '@ValenceClient/library/showIdOf';
import { whereItFalls } from '@ValenceClient/library/whereItFalls';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { theArtworkFor } from '@ValenceMobile/components/APoster/theArtworkFor';
import { theStillFor } from '@ValenceMobile/components/APoster/theStillFor';
import { Button } from '@ValenceMobile/components/Button/Button';
import type { ACardProps } from './ACard.types';

/**
 * Something in the library as a poster, which opens its page when pressed.
 *
 * An episode standing for its programme, as it does on every shelf but the one of things somebody
 * is part way through, is named for the programme and opens it rather than the episode. Drawn as a
 * still, an episode that stands for itself is named for its programme with which episode it is
 * beneath, as the television's cards are.
 *
 * @param media - What it is.
 * @param asProgramme - Whether an episode stands for its programme here.
 * @param watched - How much of it has been seen.
 * @param wide - How wide to draw it, where it fills a cell of a grid.
 * @param isStill - Whether it lies flat on a still from it rather than standing on its poster.
 * @param onLookAt - Told to open a title.
 * @param onLookAtShow - Told to open a programme.
 */
const ACard = ({
  media,
  asProgramme,
  watched = 0,
  wide,
  isStill = false,
  onLookAt,
  onLookAtShow,
}: ACardProps) => {
  const showId = asProgramme ? showIdOf(media) : null;
  const isAnEpisode = showId === null && isStill && typeof media.seriesTitle === 'string';
  const title = showId === null && !isAnEpisode ? media.title : (media.seriesTitle ?? media.title);
  const detail = isAnEpisode ? whereItFalls(media) : null;

  return (
    <Button
      tone="bare"
      label={detail === null ? title : `${title}, ${media.title}`}
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
        year={showId === null && !isAnEpisode ? media.year : null}
        artwork={isStill ? theStillFor(media) : theArtworkFor(media)}
        watched={showId === null ? watched : 0}
        isStill={isStill}
        detail={detail}
        {...(wide === undefined ? {} : { wide })}
      />
    </Button>
  );
};

ACard.displayName = 'ACard';

export { ACard };
