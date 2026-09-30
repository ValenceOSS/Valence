import { Download, Heart, Play, Share } from '@keyline-icons/react';
import { ActionBar } from '@ValenceUI/ActionBar';
import { BackToTop } from '@ValenceUI/BackToTop';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { SplitButton } from '@ValenceUI/SplitButton';
import type { UiExample } from './UiExample.types';

const VARIANTS = [
  'primary',
  'confirm',
  'secondary',
  'glossy',
  'raised',
  'soft',
  'ghost',
  'danger',
  'overlay',
  'subtle',
  'link',
  'discord',
] as const;

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const nothing = () => undefined;

const BUTTON_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  Button: [
    {
      title: 'Variants',
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      ),
    },
    {
      title: 'Sizes',
      render: () => (
        <div className="flex flex-wrap items-end gap-3">
          {SIZES.map((size) => (
            <Button key={size} variant="secondary" size={size}>
              {size}
            </Button>
          ))}
        </div>
      ),
    },
    {
      title: 'States',
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="confirm">
            <Icon of={Play} size={16} />
            Play
          </Button>
          <Button variant="secondary" isLoading>
            Saving
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" isActive>
            Active
          </Button>
          <Button variant="secondary" isPill>
            Pill
          </Button>
        </div>
      ),
    },
    {
      title: 'Icon only',
      render: () => (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" isIconOnly label="Share">
            <Icon of={Share} size={16} />
          </Button>
          <Button variant="overlay" isIconOnly label="Download">
            <Icon of={Download} size={16} />
          </Button>
          <Button variant="ghost" isIconOnly isPill label="Like">
            <Icon of={Heart} size={16} />
          </Button>
        </div>
      ),
    },
  ],
  SplitButton: [
    {
      title: 'With a choice',
      render: () => (
        <SplitButton
          onClick={nothing}
          choiceLabel="Choose the quality"
          choiceName="Quality"
          options={[
            { id: 'original', label: 'Original' },
            { id: 'high', label: 'High' },
          ]}
          selectedId="original"
          onSelect={nothing}
        >
          Download
        </SplitButton>
      ),
    },
  ],
  ActionBar: [
    {
      title: 'Primary with actions',
      render: () => (
        <ActionBar
          label="What to do with this film"
          primary={
            <Button variant="confirm" size="lg" className="flex-1">
              Play
            </Button>
          }
          actions={[
            { id: 'trailer', label: 'Watch the trailer', onChoose: nothing },
            { id: 'share', label: 'Share', icon: <Icon of={Share} size={16} />, onChoose: nothing },
          ]}
        />
      ),
    },
  ],
  Link: [
    {
      title: 'Inline',
      render: () => (
        <p className="text-sm text-text-muted">
          Read the <Link href="https://docs.getvalence.app">documentation</Link> to set it up.
        </p>
      ),
    },
  ],
  BackToTop: [
    {
      title: 'Appears once the page is scrolled',
      render: () => <BackToTop className="static" />,
    },
  ],
  FilePicker: [
    {
      title: 'Pick a file',
      render: () => (
        <FilePicker label="Upload a poster" accept="image/*" onPick={nothing} variant="secondary">
          Upload a poster
        </FilePicker>
      ),
    },
  ],
};

export { BUTTON_EXAMPLES };
