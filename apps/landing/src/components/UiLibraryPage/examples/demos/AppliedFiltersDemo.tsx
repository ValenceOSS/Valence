import { useState } from 'react';
import { AppliedFilters } from '@ValenceUI/AppliedFilters';

const GROUPS = [
  {
    name: 'Genre',
    options: [
      { id: 'drama', label: 'Drama' },
      { id: 'science-fiction', label: 'Science fiction' },
    ],
  },
  {
    name: 'Quality',
    options: [
      { id: '4k', label: '4K' },
      { id: 'hdr', label: 'HDR' },
    ],
  },
] as const;

const ALL = ['drama', 'science-fiction', '4k', 'hdr'] as const;

/**
 * The filters in force, each removable on its own and all of them clearable at once, starting again
 * from the full set when the last is gone.
 */
const AppliedFiltersDemo = () => {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(ALL));

  return (
    <div className="flex flex-col items-start gap-3">
      <AppliedFilters
        groups={GROUPS}
        selected={selected}
        onRemove={(id) => {
          setSelected((was) => new Set([...was].filter((one) => one !== id)));
        }}
        onClear={() => {
          setSelected(new Set());
        }}
      />

      {selected.size === 0 ? (
        <span className="text-sm text-text-muted">No filters. Everything is showing.</span>
      ) : null}
    </div>
  );
};

AppliedFiltersDemo.displayName = 'AppliedFiltersDemo';

export { AppliedFiltersDemo };
