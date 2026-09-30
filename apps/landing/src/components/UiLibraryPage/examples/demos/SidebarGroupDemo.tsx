import { useState } from 'react';
import { BookOpen, Film, Search } from '@keyline-icons/react';
import { SidebarGroup } from '@ValenceUI/SidebarGroup';

const ITEMS = [
  { id: 'films', label: 'Films', icon: Film },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'search', label: 'Search', icon: Search },
] as const;

/**
 * One collapsible group of a sidebar, with its highlight following the pointer and the chosen place
 * marked.
 */
const SidebarGroupDemo = () => {
  const [value, setValue] = useState('films');
  const [pointedAt, setPointedAt] = useState<string | null>(null);

  return (
    <div className="w-60">
      <SidebarGroup
        label="Library"
        items={ITEMS}
        value={value}
        onSelect={setValue}
        markGroup="ui-library-sidebar-group"
        pointedAt={pointedAt}
        onPointAt={setPointedAt}
        defaultIsOpen
      />
    </div>
  );
};

SidebarGroupDemo.displayName = 'SidebarGroupDemo';

export { SidebarGroupDemo };
