import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { APoster } from '@ValencePhone/components/APoster/APoster';
import { Button } from '@ValencePhone/components/Button/Button';
import { whatAPhoneAsksFor } from '@ValencePhone/components/TheSearch/whatAPhoneAsksFor';
import type { ACatalogueCardProps } from './ACatalogueCard.types';

/**
 * Something from the catalogue, as a poster saying whether it is here or asked for already.
 *
 * @param title - What it is.
 * @param onAsk - Told it was pressed, to open the page where it can be asked for.
 */
const ACatalogueCard = ({ title, onAsk }: ACatalogueCardProps) => {
  const { kind } = title;

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
      />
    </Button>
  );
};

ACatalogueCard.displayName = 'ACatalogueCard';

export { ACatalogueCard };
