import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { CommandPalette } from '@ValenceUI/CommandPalette';

const GROUPS = [
  {
    heading: 'Go to',
    items: [
      { id: 'films', label: 'Films' },
      { id: 'shows', label: 'Shows' },
      { id: 'music', label: 'Music', detail: 'Your library' },
    ],
  },
  {
    heading: 'Do',
    items: [
      { id: 'scan', label: 'Scan every library' },
      { id: 'theme', label: 'Switch theme' },
    ],
  },
] as const;

/**
 * A button that opens the command palette, filtering its commands as the query is typed and closing
 * when one is chosen.
 */
const CommandPaletteDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open the command palette
      </Button>

      <CommandPalette
        label="Commands"
        isOpen={isOpen}
        onClose={close}
        query={query}
        onQueryChange={setQuery}
        groups={GROUPS.map((group) => ({
          heading: group.heading,
          items: group.items.filter((item) => item.label.toLowerCase().includes(needle)),
        })).filter((group) => group.items.length > 0)}
        onSelect={close}
        placeholder="Search commands"
      />
    </>
  );
};

CommandPaletteDemo.displayName = 'CommandPaletteDemo';

export { CommandPaletteDemo };
