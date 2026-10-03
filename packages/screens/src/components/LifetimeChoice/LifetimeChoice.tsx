import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { FormField } from '@ValenceUI/FormField';
import { SETUP_LINK_LIFETIMES } from '@ValenceContracts/schemas/SetupLink';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { LifetimeChoiceProps } from './LifetimeChoice.types';

/**
 * Lets an administrator choose how long a setup link works for: a day, a week or a month.
 *
 * @param value - The lifetime chosen.
 * @param onChoose - Told when another is chosen.
 */
const LifetimeChoice = ({ value, onChoose }: LifetimeChoiceProps) => (
  <FormField label={say('common.linkWorksFor')}>
    <SegmentedRow
      label={say('common.linkWorksFor')}
      size="sm"
      value={String(value)}
      items={SETUP_LINK_LIFETIMES.map((days) => ({
        id: String(days),
        label: sayCount('common.count.days', days),
      }))}
      onSelect={(id) => {
        const chosen = SETUP_LINK_LIFETIMES.find((days) => String(days) === id);

        if (chosen !== undefined) {
          onChoose(chosen);
        }
      }}
    />
  </FormField>
);

LifetimeChoice.displayName = 'LifetimeChoice';

export { LifetimeChoice };
