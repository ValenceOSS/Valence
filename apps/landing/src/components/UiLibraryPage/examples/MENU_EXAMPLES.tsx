import { Copy, Download, Heart, Settings, Share } from '@keyline-icons/react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { ContextMenu } from '@ValenceUI/ContextMenu';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { PopoverPanel } from '@ValenceUI/PopoverPanel';
import { SettingsMenu } from '@ValenceUI/SettingsMenu';
import { Tooltip } from '@ValenceUI/Tooltip';
import { TooltipScope } from '@ValenceUI/TooltipScope';
import { CommandPaletteDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/CommandPaletteDemo';
import { ConfirmDialogDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/ConfirmDialogDemo';
import { DialogCompanionDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/DialogCompanionDemo';
import { DialogDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/DialogDemo';
import { DrawerDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/DrawerDemo';
import type { UiExample } from './UiExample.types';

const nothing = () => undefined;

const QUALITIES = [
  { id: 'original', label: 'Original', detail: '4K · 28 GB' },
  { id: 'high', label: 'High', detail: '1080p · 6 GB' },
  { id: 'low', label: 'Data saver', detail: '720p · 2 GB' },
];

const MENU_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  OptionMenu: [
    {
      title: 'As a field',
      render: () => (
        <OptionMenu
          label="Quality"
          triggerShape="field"
          align="start"
          trigger={<span>Original</span>}
          groups={[
            { name: 'Quality', options: QUALITIES, selectedId: 'original', onSelect: nothing },
          ]}
        />
      ),
    },
    {
      title: 'As a button',
      render: () => (
        <OptionMenu
          label="Sort"
          triggerShape="button"
          align="start"
          trigger={<span>Newest first</span>}
          groups={[
            {
              name: 'Sort',
              options: [
                { id: 'newest', label: 'Newest first' },
                { id: 'oldest', label: 'Oldest first' },
                { id: 'title', label: 'Title' },
              ],
              selectedId: 'newest',
              onSelect: nothing,
            },
          ]}
        />
      ),
    },
  ],
  ActionMenu: [
    {
      title: 'Looks',
      render: () => (
        <div className="flex items-center gap-3">
          {(['plain', 'raised'] as const).map((look) => (
            <ActionMenu
              key={look}
              label={`More, ${look}`}
              look={look}
              trigger={<span className="text-lg leading-none">⋯</span>}
              groups={[
                {
                  items: [
                    {
                      id: 'share',
                      label: 'Share',
                      icon: <Icon of={Share} size={16} />,
                      onChoose: nothing,
                    },
                    {
                      id: 'copy',
                      label: 'Copy the link',
                      icon: <Icon of={Copy} size={16} />,
                      onChoose: nothing,
                    },
                  ],
                },
                {
                  items: [
                    {
                      id: 'remove',
                      label: 'Remove from the library',
                      isDestructive: true,
                      onChoose: nothing,
                    },
                  ],
                },
              ]}
            />
          ))}
        </div>
      ),
    },
  ],
  FilterMenu: [
    {
      title: 'Several groups',
      render: () => (
        <FilterMenu
          label="Filters"
          hasLabel
          groups={[
            {
              name: 'Genre',
              options: [
                { id: 'drama', label: 'Drama' },
                { id: 'comedy', label: 'Comedy' },
              ],
            },
            {
              name: 'Watched',
              isSingle: true,
              options: [
                { id: 'unwatched', label: 'Not watched' },
                { id: 'watched', label: 'Watched' },
              ],
            },
          ]}
          selected={new Set(['drama'])}
          onChange={nothing}
        />
      ),
    },
  ],
  ContextMenu: [
    {
      title: 'Right-click the card',
      render: () => (
        <ContextMenu
          label="Film actions"
          groups={[
            {
              items: [
                {
                  id: 'download',
                  label: 'Download',
                  icon: <Icon of={Download} size={16} />,
                  onChoose: nothing,
                },
              ],
            },
          ]}
        >
          <div className="valence-surface rounded-xl px-6 py-8 text-sm text-text-muted">
            Right-click here
          </div>
        </ContextMenu>
      ),
    },
  ],
  SettingsMenu: [
    {
      title: 'A player-style menu',
      render: () => (
        <SettingsMenu
          label="Settings"
          trigger={<Icon of={Settings} size={18} />}
          rows={[
            {
              kind: 'choice',
              id: 'quality',
              label: 'Quality',
              icon: <Icon of={Settings} size={16} />,
              choices: QUALITIES,
              selectedId: 'original',
              onSelect: nothing,
            },
            {
              kind: 'toggle',
              id: 'autoplay',
              label: 'Autoplay',
              icon: <Icon of={Heart} size={16} />,
              isOn: true,
              onToggle: nothing,
            },
          ]}
        />
      ),
    },
  ],
  PopoverPanel: [
    {
      title: 'A panel on a button',
      render: () => (
        <PopoverPanel
          label="Share"
          heading="Share"
          triggerLook="button"
          trigger={<span>Share</span>}
        >
          <p className="text-sm text-text-muted">Anything can sit in here.</p>
        </PopoverPanel>
      ),
    },
  ],
  HoverCard: [
    {
      title: 'Hover the name',
      render: () => (
        <HoverCard detail={<p className="text-sm">Played Ted Kaczynski in 2026.</p>}>
          <span className="text-sm font-medium underline">Jacob Tremblay</span>
        </HoverCard>
      ),
    },
  ],
  Tooltip: [
    {
      title: 'Sides',
      render: () => (
        <div className="flex flex-wrap gap-3">
          {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
            <Tooltip key={side} label={`On the ${side}`} side={side}>
              <Button variant="secondary" size="sm">
                {side}
              </Button>
            </Tooltip>
          ))}
        </div>
      ),
    },
  ],
  DialogTitle: [
    {
      title: 'Sizes',
      render: () => (
        <div className="flex flex-col gap-6">
          <DialogTitle title="Add a library" detail="Point Valence at a folder of films." />
          <DialogTitle title="Compact" detail="A smaller heading." size="compact" />
        </div>
      ),
    },
  ],
  DialogFooter: [
    {
      title: 'Answers',
      render: () => (
        <DialogFooter
          dismiss={{ onChoose: nothing }}
          confirm={{ label: 'Save', onChoose: nothing }}
          note="The address could not be reached."
        />
      ),
    },
  ],
  Dialog: [
    {
      title: 'Opened from a button',
      render: () => <DialogDemo />,
    },
  ],
  DialogContent: [
    {
      title: 'Inside a dialog',
      render: () => <DialogDemo />,
    },
  ],
  DialogCompanion: [
    {
      title: 'Beside the dialog it came from',
      render: () => <DialogCompanionDemo />,
    },
  ],
  ConfirmDialog: [
    {
      title: 'Asks before removing',
      render: () => <ConfirmDialogDemo />,
    },
  ],
  Drawer: [
    {
      title: 'Slides in from the edge',
      render: () => <DrawerDemo />,
    },
  ],
  CommandPalette: [
    {
      title: 'Filters as you type',
      render: () => <CommandPaletteDemo />,
    },
  ],
  TooltipScope: [
    {
      title: 'Names come straight away once one is showing',
      render: () => (
        <TooltipScope>
          <div className="flex gap-2">
            <Tooltip label="Copy">
              <Button variant="secondary" isIconOnly label="Copy" hasTooltip={false}>
                <Icon of={Copy} size={16} />
              </Button>
            </Tooltip>
            <Tooltip label="Share">
              <Button variant="secondary" isIconOnly label="Share" hasTooltip={false}>
                <Icon of={Share} size={16} />
              </Button>
            </Tooltip>
            <Tooltip label="Download">
              <Button variant="secondary" isIconOnly label="Download" hasTooltip={false}>
                <Icon of={Download} size={16} />
              </Button>
            </Tooltip>
          </div>
        </TooltipScope>
      ),
    },
  ],
};

export { MENU_EXAMPLES };
