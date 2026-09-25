import { useQuery } from '@tanstack/react-query';
import { byMediaId } from '@ValenceClient/playback/watchProgress';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { isTitleWatched } from '@ValenceClient/requests/isTitleWatched';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { APoster } from '@ValenceMobile/components/APoster/APoster';
import { Button } from '@ValenceMobile/components/Button/Button';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import type { ACatalogueCardProps } from './ACatalogueCard.types';

/**
 * Something from the catalogue, as a poster saying whether it is here or asked for already.
 *
 * @param title - What it is.
 * @param onAsk - Told it was pressed, to open the page where it can be asked for.
 * @param wide - How wide to draw it, where it fills a cell of a grid.
 */
const ACatalogueCard = ({ title, onAsk, wide }: ACatalogueCardProps) => {
  const { kind } = title;
  const watched = useQuery(viewingQueries.progress());
  const isWatched = isTitleWatched(title, byMediaId(watched.data ?? []));

  if (!whatAPhoneAsksFor(kind)) {
    return null;
  }

  return (
    <Button
      tone="bare"
      label={title.title}
      onPress={() => {
        onAsk(kind, title.id);
      }}
    >
      <APoster
        title={title.title}
        year={title.year}
        artwork={title.posterUrl}
        note={describeStanding(title.standing)?.label ?? null}
        watched={isWatched ? 1 : 0}
        {...(wide === undefined ? {} : { wide })}
      />
    </Button>
  );
};

ACatalogueCard.displayName = 'ACatalogueCard';

export { ACatalogueCard };
