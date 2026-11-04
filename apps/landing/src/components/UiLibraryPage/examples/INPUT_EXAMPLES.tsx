import { ArrowRight, Search } from '@keyline-icons/react';
import { CAPTION_COLOURS } from '@ValenceCore/tokens/CAPTION_COLOURS';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { ColourPicker } from '@ValenceUI/ColourPicker';
import { FilterBar } from '@ValenceUI/FilterBar';
import { FilterSplit } from '@ValenceUI/FilterSplit';
import { Form } from '@ValenceUI/Form';
import { FormField } from '@ValenceUI/FormField';
import { Kbd } from '@ValenceUI/Kbd';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { PinField } from '@ValenceUI/PinField';
import { ScopedField } from '@ValenceUI/ScopedField';
import { SelectField } from '@ValenceUI/SelectField';
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

const LIBRARIES = [
  { id: 'films', label: 'Films' },
  { id: 'shows', label: 'Shows' },
  { id: 'music', label: 'Music' },
];

const FILTERS = [
  {
    name: 'Kind',
    isSingle: true,
    options: [
      { id: 'kind:film', label: 'Films' },
      { id: 'kind:show', label: 'Shows' },
    ],
  },
  {
    name: 'Status',
    options: [
      { id: 'status:unwatched', label: 'Unwatched' },
      { id: 'status:favourite', label: 'Favourites' },
    ],
  },
];

const TEMPLATE = `{
  "title": "{{title}}",
  "message": "{{summary}}"
}`;

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
      title: 'Several lines, and code',
      render: () => (
        <div className="flex w-full max-w-md flex-col gap-4">
          <TextField
            label="Message"
            rows={3}
            value="The server restarts at midnight for an update."
            onValueChange={nothing}
          />
          <TextField label="Template" rows={5} isCode value={TEMPLATE} onValueChange={nothing} />
        </div>
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
  SelectField: [
    {
      title: 'One choice from a list',
      render: () => (
        <SelectField
          label="Library"
          options={LIBRARIES}
          value="shows"
          description="Where new titles are added."
          onSelect={nothing}
          className="w-64"
        />
      ),
    },
  ],
  MultiSelectField: [
    {
      title: 'Several choices, one locked',
      render: () => (
        <MultiSelectField
          label="Libraries"
          options={[...LIBRARIES.slice(0, 2), { id: 'music', label: 'Music', isLocked: true }]}
          value={['films', 'music']}
          placeholder="Every library"
          onChange={nothing}
          className="w-64"
        />
      ),
    },
  ],
  ScopedField: [
    {
      title: 'A search narrowed by a choice, with a submit',
      render: () => (
        <ScopedField
          label="Search"
          isLabelHidden
          placeholder="Find a title"
          value=""
          onValueChange={nothing}
          choices={[
            { label: 'Which library', options: LIBRARIES, value: 'films', onChange: nothing },
          ]}
          submit={{ label: 'Search', icon: ArrowRight }}
          className="w-full max-w-md"
        />
      ),
    },
  ],
  PinField: [
    {
      title: 'A new PIN',
      render: () => (
        <PinField
          label="PIN"
          value="12"
          isNew
          description="Four digits, asked for when this profile is opened."
          onValueChange={nothing}
        />
      ),
    },
    {
      title: 'With an error',
      render: () => (
        <PinField label="PIN" value="1234" error="That PIN is not right." onValueChange={nothing} />
      ),
    },
  ],
  FilterBar: [
    {
      title: 'Each filter as its own chip',
      render: () => (
        <FilterBar
          label="Filter the library"
          groups={FILTERS}
          selected={new Set(['kind:film'])}
          onChange={nothing}
        />
      ),
    },
  ],
  FilterSplit: [
    {
      title: 'A scope and its filters, joined',
      render: () => (
        <FilterSplit
          label="Filter the library"
          scope={{ label: 'Which library', options: LIBRARIES, value: 'films', onChange: nothing }}
          groups={FILTERS}
          selected={new Set(['status:unwatched'])}
          onChange={nothing}
        />
      ),
    },
  ],
  Form: [
    {
      title: 'Fields sent together',
      render: () => (
        <Form
          label="Sign in"
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <TextField label="Email" type="email" value="" onValueChange={nothing} />
          <TextField label="Password" type="password" value="" onValueChange={nothing} />
          <Button variant="confirm" type="submit">
            Sign in
          </Button>
        </Form>
      ),
    },
  ],
  Kbd: [
    {
      title: 'Keys, on a field and inverted',
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <Kbd keys={['⌘', 'K']} />
          <Kbd keys={['Esc']} size="sm" />
          <span className="rounded-lg bg-text px-2 py-1">
            <Kbd keys={['⇧', '?']} tone="inverse" />
          </span>
        </div>
      ),
    },
  ],
};

export { INPUT_EXAMPLES };
