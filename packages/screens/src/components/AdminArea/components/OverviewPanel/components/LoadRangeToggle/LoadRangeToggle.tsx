import { PanelCardChoice } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice';
import { RESOURCE_SAMPLE_RANGES } from '@ValenceContracts/schemas/ResourceSample';
import type { PanelCardChoiceOption } from '@ValenceScreens/components/PanelCardChoice/PanelCardChoice.types';
import type { LoadRange, LoadRangeToggleProps } from './LoadRangeToggle.types';
import { say } from '@ValenceI18n/say';

const VALID_RANGES: readonly LoadRange[] = ['minute', ...RESOURCE_SAMPLE_RANGES];

const RANGE_NAMES: Readonly<Record<LoadRange, string>> = {
  minute: say('screens.overviewPanel.loadRangeToggle.lastMinute'),
  '24h': say('client.admin.logRanges.last24Hours'),
  '3d': say('screens.overviewPanel.loadRangeToggle.last3Days'),
  '7d': say('client.admin.logRanges.last7Days'),
};

const OPTIONS: PanelCardChoiceOption[] = VALID_RANGES.map((range) => ({
  id: range,
  label: RANGE_NAMES[range],
}));

/**
 * Whether a string is one of the ranges the load card can show, so a choice from the menu can be
 * trusted without a cast.
 *
 * @param value - What was chosen.
 * @returns Whether it names a real range.
 */
const isLoadRange = (value: string): value is LoadRange =>
  VALID_RANGES.some((candidate) => candidate === value);

/**
 * Chooses how far back the load card looks: the last minute it has been open for, kept in memory
 * alone, or a range read from what the server has persisted.
 *
 * @param value - The range currently shown.
 * @param onChange - Told which range was chosen.
 */
const LoadRangeToggle = ({ value, onChange }: LoadRangeToggleProps) => (
  <PanelCardChoice
    label={say('screens.overviewPanel.loadRangeToggle.howFarBackToShowThe')}
    options={OPTIONS}
    value={value}
    onSelect={(id) => {
      if (isLoadRange(id)) {
        onChange(id);
      }
    }}
  />
);

LoadRangeToggle.displayName = 'LoadRangeToggle';

export { LoadRangeToggle };
