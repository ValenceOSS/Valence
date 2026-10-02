import { Bell, Film, Search, Settings } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { GlassPanel } from '@ValenceUI/GlassPanel';
import { HeadedSection } from '@ValenceUI/HeadedSection';
import { Icon } from '@ValenceUI/Icon';
import { PageDots } from '@ValenceUI/PageDots';
import { ReadMore } from '@ValenceUI/ReadMore';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Sidebar } from '@ValenceUI/Sidebar';
import { Switch } from '@ValenceUI/Switch';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { Well } from '@ValenceUI/Well';
import { StepperDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/StepperDemo';
import { SidebarGroupDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/SidebarGroupDemo';
import { TabsDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/TabsDemo';
import type { UiExample } from './UiExample.types';

const nothing = () => undefined;

const LAYOUT_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  Card: [
    {
      title: 'Tones',
      render: () => (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['raised', 'glass', 'plain'] as const).map((tone) => (
            <Card key={tone} tone={tone}>
              <p className="text-sm font-medium">{tone}</p>
            </Card>
          ))}
        </div>
      ),
    },
  ],
  Well: [
    {
      title: 'An inset panel',
      render: () => (
        <Well>
          <p className="text-sm text-text-muted">Sections of a dialog sit in these.</p>
        </Well>
      ),
    },
  ],
  GlassPanel: [
    {
      title: 'Elevations',
      render: () => (
        <div className="grid gap-3 sm:grid-cols-2">
          {(['floating', 'inset', 'clear', 'film'] as const).map((elevation) => (
            <GlassPanel key={elevation} elevation={elevation} className="p-4">
              <p className="text-sm font-medium">{elevation}</p>
            </GlassPanel>
          ))}
        </div>
      ),
    },
  ],
  HeadedSection: [
    {
      title: 'With actions',
      render: () => (
        <HeadedSection
          title="Libraries"
          actions={
            <Button variant="secondary" size="sm">
              Add
            </Button>
          }
        >
          <p className="text-sm text-text-muted">Two libraries, 1,284 titles.</p>
        </HeadedSection>
      ),
    },
  ],
  SettingList: [
    {
      title: 'Rows of settings',
      render: () => (
        <SettingList>
          <SettingRow
            title="Notifications"
            description="When a request arrives."
            icon={<Icon of={Bell} size={18} />}
          >
            <Switch label="Notifications" isLabelHidden isOn onToggle={nothing} />
          </SettingRow>
          <SettingRow title="Search history" icon={<Icon of={Search} size={18} />}>
            <Switch label="Search history" isLabelHidden isOn={false} onToggle={nothing} />
          </SettingRow>
        </SettingList>
      ),
    },
  ],
  SettingRow: [
    {
      title: 'Marked',
      render: () => (
        <SettingRow title="Changed but not saved" description="Marked rows stand out." isMarked />
      ),
    },
  ],
  TabRow: [
    {
      title: 'Track and underlined',
      render: () => (
        <div className="flex flex-col items-start gap-4">
          {(['track', 'underlined'] as const).map((tone) => (
            <Tabs key={tone} value="films" onValueChange={nothing}>
              <TabRow
                label={`Sections, ${tone}`}
                tone={tone}
                value="films"
                groups={[
                  {
                    items: [
                      { id: 'films', label: 'Films' },
                      { id: 'shows', label: 'Shows' },
                      { id: 'music', label: 'Music' },
                    ],
                  },
                ]}
              />
            </Tabs>
          ))}
        </div>
      ),
    },
  ],
  Sidebar: [
    {
      title: 'Grouped places',
      render: () => (
        <div className="h-72 w-60">
          <Sidebar
            label="Admin"
            value="libraries"
            onSelect={nothing}
            variant="floating"
            groups={[
              {
                label: 'Content',
                items: [
                  { id: 'libraries', label: 'Libraries', icon: Film },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ],
              },
            ]}
          />
        </div>
      ),
    },
  ],
  ReadMore: [
    {
      title: 'Clamped text',
      render: () => (
        <ReadMore lines={2} className="max-w-md text-sm text-text-muted">
          A long synopsis runs on past the lines it is given. Pressing Read more shows the rest of
          it, and Read less folds it away again, so a long description never pushes everything else
          off the screen before somebody asks to see it.
        </ReadMore>
      ),
    },
  ],
  PageDots: [
    {
      title: 'Five pages',
      render: () => <PageDots count={5} selectedIndex={1} onSelect={nothing} label="Featured" />,
    },
  ],
  Stepper: [
    {
      title: 'Moving through a flow',
      render: () => <StepperDemo />,
    },
  ],
  Tabs: [
    {
      title: 'A working set of tabs',
      render: () => <TabsDemo />,
    },
  ],
  TabPanel: [
    {
      title: 'One panel per tab',
      render: () => <TabsDemo />,
    },
  ],
  SidebarGroup: [
    {
      title: 'A collapsible group',
      render: () => <SidebarGroupDemo />,
    },
  ],
};

export { LAYOUT_EXAMPLES };
