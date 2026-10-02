import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import type { StarChoiceProps } from './StarChoice.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const OUT_OF = [5, 4, 3, 2, 1] as const;

const TAKE_IT_BACK = 'none';

/**
 * How many stars to give something, from five down to one, in the panel down the right of the
 * screen, with the remote starting on the stars already given. Where something has been rated, the
 * rating can be taken back from the foot of the list.
 *
 * @param title - What is being rated, as the panel's heading.
 * @param given - The stars given already, or nothing.
 * @param onChoose - Told how many stars were chosen, or nothing where the rating was taken back.
 */
const StarChoice = ({ title, given, onChoose }: StarChoiceProps) => (
  <ChoicePanel
    title={title}
    choices={[
      ...OUT_OF.map((stars) => ({
        id: stars.toString(),
        label: sayCount('common.count.stars', stars),
        isCurrent: given === stars,
      })),
      ...(given === null
        ? []
        : [{ id: TAKE_IT_BACK, label: say('tv.rating.takeTheRatingBack'), isCurrent: false }]),
    ]}
    onChoose={(id) => {
      onChoose(id === TAKE_IT_BACK ? null : Number(id));
    }}
  />
);

StarChoice.displayName = 'StarChoice';

export { StarChoice };
