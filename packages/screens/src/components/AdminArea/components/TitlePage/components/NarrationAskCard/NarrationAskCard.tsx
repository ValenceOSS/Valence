import { Button } from '@ValenceUI/Button';
import { describeNarration } from '@ValenceClient/requests/describeNarration';
import type { NarrationAskCardProps } from './NarrationAskCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Where a book's audiobook waits on the operator because it is out in more than one narration and
 * nothing in the library says which the series is read in: each narration, who reads it and for
 * how long, to fetch that one, or all of them as audiobooks of their own.
 *
 * @param title - The book.
 * @param narrations - Its narrations.
 * @param isBusy - Whether a choice is being sent.
 * @param onDecide - Told which narrations to fetch.
 */
const NarrationAskCard = ({ title, narrations, isBusy, onDecide }: NarrationAskCardProps) => (
  <section
    aria-label={say('screens.adminArea.titlePage.narrationAskCard.aNarrationToChoose')}
    className="flex flex-col gap-3 rounded-2xl border border-[var(--surface-line)] bg-surface-raised p-5"
  >
    <p className="text-sm text-text">
      {say('screens.adminArea.titlePage.narrationAskCard.whichNarrationOfTitle', { title })}
    </p>

    <span className="flex flex-wrap gap-2">
      {narrations.map((narration) => (
        <Button
          key={narration.asin}
          variant="secondary"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            onDecide([narration.asin]);
          }}
        >
          {describeNarration(narration)}
        </Button>
      ))}
      <Button
        variant="secondary"
        size="sm"
        disabled={isBusy}
        onClick={() => {
          onDecide(narrations.map((narration) => narration.asin));
        }}
      >
        {say('screens.adminArea.titlePage.narrationAskCard.everyNarration')}
      </Button>
    </span>
  </section>
);

NarrationAskCard.displayName = 'NarrationAskCard';

export { NarrationAskCard };
