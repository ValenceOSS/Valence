import { PanelCardChoice } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice';
import { STATISTICS_RANGES, StatisticsRangeSchema } from '@ValenceContracts/schemas/Statistics';
import type { StatisticsRange } from '@ValenceContracts/schemas/Statistics';
import { say } from '@ValenceI18n/say';
import type { StatisticsRangeChoiceProps } from './StatisticsRangeChoice.types';

const RANGE_NAMES: Readonly<Record<StatisticsRange, string>> = {
  week: say('client.admin.logRanges.last7Days'),
  month: say('screens.adminArea.statisticsRangeChoice.last30Days'),
  quarter: say('screens.adminArea.statisticsRangeChoice.last90Days'),
  year: say('screens.adminArea.statisticsRangeChoice.lastYear'),
};

const OPTIONS = STATISTICS_RANGES.map((range) => ({ id: range, label: RANGE_NAMES[range] }));

/**
 * Chooses how far back the statistics look: a week, a month, three months or a year.
 *
 * @param value - The range shown.
 * @param onChange - Told which range was chosen.
 */
const StatisticsRangeChoice = ({ value, onChange }: StatisticsRangeChoiceProps) => (
  <PanelCardChoice
    label={say('screens.adminArea.statisticsRangeChoice.howFarBackToLook')}
    options={OPTIONS}
    value={value}
    onSelect={(id) => {
      const range = StatisticsRangeSchema.safeParse(id);

      if (range.success) {
        onChange(range.data);
      }
    }}
  />
);

StatisticsRangeChoice.displayName = 'StatisticsRangeChoice';

export { StatisticsRangeChoice };
