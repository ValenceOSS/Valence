import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { RESOURCE_SAMPLE_RANGES } from '@ValenceContracts/schemas/ResourceSample';
import type { SegmentedItem } from '@ValenceUI/SegmentedRow.types';
import type { LoadRange, LoadRangeToggleProps } from './LoadRangeToggle.types';

const VALID_RANGES: readonly LoadRange[] = ['minute', ...RESOURCE_SAMPLE_RANGES];

const ITEMS: SegmentedItem[] = VALID_RANGES.map((range) => ({
  id: range,
  label: range === 'minute' ? 'Last minute' : range,
}));

/**
 * Whether a string is one of the ranges the load card can show, so a choice from the segmented row
 * can be trusted without a cast.
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
  <SegmentedRow
    label="How far back to show the load"
    size="xs"
    tone="accent"
    items={ITEMS}
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
