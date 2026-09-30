import { useState } from 'react';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';

const SECTIONS = [
  { id: 'films', label: 'Films', body: 'Every film in the library, newest first.' },
  { id: 'shows', label: 'Shows', body: 'Programmes, with the next episode waiting.' },
  { id: 'music', label: 'Music', body: 'Albums and artists, and what you played last.' },
] as const;

/**
 * A working set of tabs: a row to choose from and a panel for each, the chosen one shown.
 */
const TabsDemo = () => {
  const [value, setValue] = useState<string>('films');

  return (
    <Tabs value={value} onValueChange={setValue} className="flex w-full max-w-md flex-col gap-4">
      <TabRow
        label="Sections"
        value={value}
        groups={[{ items: SECTIONS.map(({ id, label }) => ({ id, label })) }]}
      />

      {SECTIONS.map((section) => (
        <TabPanel key={section.id} value={section.id}>
          <p className="text-sm text-text-muted">{section.body}</p>
        </TabPanel>
      ))}
    </Tabs>
  );
};

TabsDemo.displayName = 'TabsDemo';

export { TabsDemo };
