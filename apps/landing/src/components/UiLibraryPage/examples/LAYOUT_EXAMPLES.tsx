import { Bell, Film, Search, Settings } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { InfoHeading } from '@ValenceUI/InfoHeading';
import { InfoNote } from '@ValenceUI/InfoNote';
import { InfoRow } from '@ValenceUI/InfoRow';
import { PageHero } from '@ValenceUI/PageHero';
import { PanelCard } from '@ValenceUI/PanelCard';
import { ResizablePanel } from '@ValenceUI/ResizablePanel';
import { SectionCard } from '@ValenceUI/SectionCard';
import { SectionIndex } from '@ValenceUI/SectionIndex';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SiteFooter } from '@ValenceUI/SiteFooter';
import { SiteNav } from '@ValenceUI/SiteNav';
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
import { ExampleSiteLink } from '@ValenceLanding/components/UiLibraryPage/examples/demos/ExampleSiteLink';
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
  SectionIndex: [
    {
      title: 'Where a long page goes',
      render: () => (
        <SectionIndex
          label="On this page"
          sections={[
            { id: 'title', label: 'Title and release', note: '4 fields' },
            { id: 'people', label: 'People' },
            { id: 'artwork', label: 'Artwork', note: '2 changed' },
          ]}
        />
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
    {
      title: 'With an ⓘ and a description that carries more than words',
      render: () => (
        <SettingRow
          title="Short segments"
          info="Smaller pieces start sooner and seek faster, at a little more work for the server."
          description={
            <>
              Starts playback sooner. <strong className="text-text">On</strong> for most servers.
            </>
          }
        >
          <Switch label="Short segments" isLabelHidden isOn onToggle={nothing} />
        </SettingRow>
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
  PanelCard: [
    {
      title: 'A titled card with actions',
      render: () => (
        <PanelCard
          title="Libraries"
          actions={
            <Button variant="ghost" size="sm">
              Add library
            </Button>
          }
          className="w-full max-w-md"
        >
          <p className="text-sm text-text-muted">Three libraries, last scanned an hour ago.</p>
        </PanelCard>
      ),
    },
    {
      title: 'Flush, checking what it shows',
      render: () => (
        <PanelCard
          title="Sessions"
          isFlush
          freshness={{ isChecking: true, couldNotCheck: false }}
          className="w-full max-w-md"
        >
          <p className="px-5 py-4 text-sm text-text-muted">Nothing is playing.</p>
        </PanelCard>
      ),
    },
  ],
  SectionCard: [
    {
      title: 'One part of a page',
      render: () => (
        <SectionCard>
          <p className="p-6 text-sm text-text-muted">A section of the page sits on its own card.</p>
        </SectionCard>
      ),
    },
  ],
  SettingGroup: [
    {
      title: 'Rows under a heading',
      render: () => (
        <SettingGroup
          title="Playback"
          description="How titles play on this device."
          className="w-full max-w-md"
        >
          <SettingRow title="Autoplay the next episode">
            <Switch label="Autoplay the next episode" isLabelHidden isOn onToggle={nothing} />
          </SettingRow>
          <SettingRow title="Skip intros">
            <Switch label="Skip intros" isLabelHidden isOn={false} onToggle={nothing} />
          </SettingRow>
        </SettingGroup>
      ),
    },
  ],
  InfoHeading: [
    {
      title: 'An information card',
      render: () => (
        <div className="flex w-64 flex-col rounded-xl border border-[var(--surface-line)] p-1">
          <InfoHeading>Read a minute ago</InfoHeading>
          <InfoRow label="Resolution">3840 × 2160</InfoRow>
          <InfoRow label="Video">HEVC · HDR10</InfoRow>
          <InfoNote>Plays as it is on this device.</InfoNote>
        </div>
      ),
    },
  ],
  InfoRow: [
    {
      title: 'One fact',
      render: () => (
        <div className="w-64">
          <InfoRow label="Audio">Dolby Digital+ 5.1</InfoRow>
        </div>
      ),
    },
  ],
  InfoNote: [
    {
      title: 'A line that qualifies the rows above',
      render: () => (
        <div className="w-64">
          <InfoNote>Read from the file, not the catalogue.</InfoNote>
        </div>
      ),
    },
  ],
  ResizablePanel: [
    {
      title: 'Drag its edge',
      render: () => (
        <div className="flex h-40 w-full overflow-hidden rounded-xl border border-[var(--surface-line)]">
          <ResizablePanel label="Queue" defaultWidth={200} minWidth={140} maxWidth={320}>
            <p className="p-4 text-sm text-text-muted">Up next</p>
          </ResizablePanel>
          <div className="flex-1 p-4 text-sm text-text-muted">Now playing</div>
        </div>
      ),
    },
  ],
  PageHero: [
    {
      title: 'A page’s opening',
      render: () => (
        <PageHero
          eyebrow="Plugins"
          lead="Add what"
          accent="you need"
          trail="to Valence."
          description="Every plugin runs in its own process and asks before it reaches anything."
          actions={<Button variant="confirm">Browse plugins</Button>}
        />
      ),
    },
  ],
  SiteNav: [
    {
      title: 'The site’s bar, held in a frame',
      render: () => (
        <div className="relative h-24 w-full overflow-hidden rounded-xl border border-[var(--surface-line)] [transform:translateZ(0)]">
          <SiteNav here="landing" pathname="/ui" InSiteLink={ExampleSiteLink} starCount={null} />
        </div>
      ),
    },
  ],
  SiteFooter: [
    {
      title: 'The site’s footer',
      render: () => (
        <div className="w-full overflow-hidden rounded-xl border border-[var(--surface-line)]">
          <SiteFooter here="landing" InSiteLink={ExampleSiteLink} logoSrc="/valence-icon.png" />
        </div>
      ),
    },
  ],
};

export { LAYOUT_EXAMPLES };
