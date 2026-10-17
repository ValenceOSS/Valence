import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import type { NothingHereProps } from './NothingHere.types';

const IN_A_CARD =
  'in-[.valence-card-face]:h-full in-[.valence-card-face]:min-h-0 in-[.valence-card-face]:justify-center in-[.valence-card-face]:gap-3 in-[.valence-card-face]:py-8';

const ICON_IN_A_CARD = 'in-[.valence-card-face]:size-7';

const TITLE_IN_A_CARD =
  'in-[.valence-card-face]:text-sm in-[.valence-card-face]:font-medium in-[.valence-card-face]:tracking-normal in-[.valence-card-face]:text-text-muted';

const DETAIL_IN_A_CARD = 'in-[.valence-card-face]:text-[0.8125rem]';

/**
 * Says why a screen is empty, in the one shape every empty screen uses.
 *
 * There were four of these and they agreed on nothing — the films and programmes pages drew a bare
 * paragraph against the left margin, the books page centred a larger heading with no icon, and the
 * home page did a third thing. A household that has just installed Valence sees several of these
 * before it sees anything else, and four answers to the same question read as four different
 * products.
 *
 * Whether it fills the page is the caller's to say, because the same words are a whole screen when
 * nothing has been set up and a note under a heading when one shelf of several is empty.
 *
 * @param of - The icon to draw above it.
 * @param title - What is missing, said in a few words.
 * @param detail - Why, and what would change it, where the title does not already say it.
 * @param action - What to press about it, where there is anything to press.
 * @param isCompact - Whether it sits small inside a card rather than filling a page.
 * @param fills - Whether this is the whole screen rather than a note within one.
 */
const NothingHere = ({
  of,
  title,
  detail,
  action,
  fills = false,
  isCompact = false,
}: NothingHereProps) => (
  <section
    className={cn(
      'flex flex-col items-center px-5 text-center',
      isCompact
        ? 'h-full justify-center gap-3 py-8'
        : fills
          ? 'min-h-[70vh] justify-center gap-4'
          : 'gap-4 py-24',
      IN_A_CARD,
    )}
  >
    <Icon of={of} size={isCompact ? 28 : 56} tone="faint" className={ICON_IN_A_CARD} />

    <div className="flex flex-col gap-2">
      <h2
        className={cn(
          isCompact
            ? 'text-sm font-medium text-text-muted'
            : 'text-2xl font-semibold tracking-tight text-text sm:text-3xl',
          TITLE_IN_A_CARD,
        )}
      >
        {title}
      </h2>

      {detail === undefined ? null : (
        <p className={cn('max-w-md text-text-muted', DETAIL_IN_A_CARD)}>{detail}</p>
      )}
    </div>

    {action === undefined ? null : <div className="mt-2">{action}</div>}
  </section>
);

NothingHere.displayName = 'NothingHere';

export { NothingHere };
