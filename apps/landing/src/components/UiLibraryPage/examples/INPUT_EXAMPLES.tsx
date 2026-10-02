import { Search } from '@keyline-icons/react';
import { CAPTION_COLOURS } from '@ValenceUI/captionColours';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { ColourPicker } from '@ValenceUI/ColourPicker';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { RangeSlider } from '@ValenceUI/RangeSlider';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Slider } from '@ValenceUI/Slider';
import { StarRating } from '@ValenceUI/StarRating';
import { SwatchRow } from '@ValenceUI/SwatchRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { ROLE_COLOURS } from '@ValenceUI/tokens/roleColours';
import { AppliedFiltersDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/AppliedFiltersDemo';
import type { UiExample } from './UiExample.types';

const nothing = () => undefined;

const INPUT_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  TextField: [
    {
      title: 'Plain, with a description',
      render: () => (
        <TextField
          label="Server name"
          value="Living room"
          description="What this server is called on every device."
          onValueChange={nothing}
        />
      ),
    },
    {
      title: 'With an error',
      render: () => (
        <TextField
          label="Email"
          type="email"
          value="not an address"
          error="That is not an email address."
          onValueChange={nothing}
        />
      ),
    },
    {
      title: 'Search pill with an icon',
      render: () => (
        <TextField
          label="Search"
          isLabelHidden
          isPill
          type="search"
          placeholder="Films, shows, people"
          icon={<Icon of={Search} size={16} />}
          value=""
          onValueChange={nothing}
        />
      ),
    },
    {
      title: 'Disabled',
      render: () => (
        <TextField label="Address" value="https://valence.local" disabled onValueChange={nothing} />
      ),
    },
  ],
  FormField: [
    {
      title: 'Around any control',
      render: () => (
        <FormField label="Theme" description="How the app looks on this device.">
          <SegmentedRow
            label="Theme"
            items={[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
              { id: 'system', label: 'System' },
            ]}
            value="system"
            onSelect={nothing}
          />
        </FormField>
      ),
    },
  ],
  Checkbox: [
    {
      title: 'States',
      render: () => (
        <div className="flex flex-col gap-3">
          <Checkbox label="Unchecked" checked={false} onCheckedChange={nothing} />
          <Checkbox label="Checked" checked onCheckedChange={nothing} />
          <Checkbox label="Some of them" isMixed onCheckedChange={nothing} />
          <Checkbox
            label="With a description"
            description="Shown under the label."
            checked
            onCheckedChange={nothing}
          />
          <Checkbox label="Disabled" disabled checked={false} onCheckedChange={nothing} />
        </div>
      ),
    },
  ],
  Switch: [
    {
      title: 'On, off and disabled',
      render: () => (
        <div className="flex flex-col gap-3">
          <Switch label="Autoplay the next episode" isOn onToggle={nothing} />
          <Switch label="Show subtitles" isOn={false} onToggle={nothing} />
          <Switch label="Disabled" isOn={false} disabled onToggle={nothing} />
        </div>
      ),
    },
  ],
  Slider: [
    {
      title: 'Default and disabled',
      render: () => (
        <div className="flex max-w-sm flex-col gap-6">
          <Slider
            label="Volume"
            value={60}
            max={100}
            valueLabel={(value) => `${value.toString()}%`}
            onValueChange={nothing}
          />
          <Slider label="Disabled" value={30} max={100} isDisabled onValueChange={nothing} />
        </div>
      ),
    },
  ],
  RangeSlider: [
    {
      title: 'A range',
      render: () => (
        <RangeSlider
          label="Released between"
          thumbLabels={['From', 'Until']}
          values={[20, 70]}
          max={100}
          onValuesChange={nothing}
          className="max-w-sm"
        />
      ),
    },
  ],
  SegmentedRow: [
    {
      title: 'Sizes',
      render: () => (
        <div className="flex flex-col items-start gap-3">
          {(['xs', 'sm', 'md'] as const).map((size) => (
            <SegmentedRow
              key={size}
              label={`Grid size, ${size}`}
              size={size}
              items={[
                { id: 'small', label: 'Small' },
                { id: 'medium', label: 'Medium' },
                { id: 'large', label: 'Large' },
              ]}
              value="medium"
              onSelect={nothing}
            />
          ))}
        </div>
      ),
    },
  ],
  ChoiceList: [
    {
      title: 'One of several',
      render: () => (
        <ChoiceList
          label="What to share"
          choices={[
            { id: 'episode', title: 'Just this episode', detail: 'I Was Stolen Away' },
            { id: 'series', title: 'The whole programme', detail: 'All 12 episodes' },
            { id: 'nothing', title: 'Nothing yet', isDisabled: true },
          ]}
          value="episode"
          onChoose={nothing}
        />
      ),
    },
    {
      title: 'Tiles',
      render: () => (
        <ChoiceList
          look="tiles"
          label="Import from"
          choices={[
            { id: 'jellyfin', title: 'Jellyfin', detail: 'Needs an API key.' },
            { id: 'emby', title: 'Emby', detail: 'Needs an API key.' },
            { id: 'plex', title: 'Plex', detail: 'Needs a Plex token.' },
          ]}
          value="jellyfin"
          onChoose={nothing}
        />
      ),
    },
  ],
  SwatchRow: [
    {
      title: 'Colours',
      render: () => (
        <SwatchRow
          label="Caption colour"
          swatches={CAPTION_COLOURS}
          value={CAPTION_COLOURS[0].id}
          onSelect={nothing}
        />
      ),
    },
  ],
  ColourPicker: [
    {
      title: 'With presets',
      render: () => (
        <ColourPicker label="Profile colour" value={ROLE_COLOURS[5]} onChange={nothing} />
      ),
    },
  ],
  StarRating: [
    {
      title: 'Rated, unrated and sizes',
      render: () => (
        <div className="flex flex-col gap-3">
          <StarRating label="Your rating" stars={4} onRate={nothing} />
          <StarRating label="Not rated" stars={null} onRate={nothing} />
          <StarRating label="Large" stars={3} size="lg" onRate={nothing} />
          <StarRating label="Disabled" stars={2} isDisabled />
        </div>
      ),
    },
  ],
  AppliedFilters: [
    {
      title: 'Remove one or clear them all',
      render: () => <AppliedFiltersDemo />,
    },
  ],
};

export { INPUT_EXAMPLES };
