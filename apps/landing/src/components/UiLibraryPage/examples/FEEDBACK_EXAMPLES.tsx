import { Film, Info } from '@keyline-icons/react';
import { AgeRating } from '@ValenceUI/AgeRating';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Skeleton } from '@ValenceUI/Skeleton';
import { Spinner } from '@ValenceUI/Spinner';
import { TomatoMark } from '@ValenceUI/TomatoMark';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { ROLE_COLOURS } from '@ValenceUI/tokens/roleColours';
import { SplashScreenDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/SplashScreenDemo';
import { ToasterDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/ToasterDemo';
import type { UiExample } from './UiExample.types';

const TONES = [
  'quiet',
  'accent',
  'success',
  'highlight',
  'solid',
  'busy',
  'waiting',
  'warning',
  'danger',
  'outline',
] as const;

const nothing = () => undefined;

const FEEDBACK_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  Badge: [
    {
      title: 'Tones',
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      title: 'Sizes and a custom colour',
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge colour={ROLE_COLOURS[5]}>Custom</Badge>
        </div>
      ),
    },
  ],
  Spinner: [
    {
      title: 'Sizes',
      render: () => (
        <div className="flex items-center gap-4">
          {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
            <Spinner key={size} size={size} label={`Loading, ${size}`} />
          ))}
        </div>
      ),
    },
    {
      title: 'With progress',
      render: () => (
        <div className="flex items-center gap-4">
          {[0, 0.25, 0.5, 0.75, 1].map((progress) => (
            <Spinner
              key={progress}
              size="lg"
              label={`${(progress * 100).toString()}% done`}
              progress={progress}
            />
          ))}
        </div>
      ),
    },
  ],
  ProgressBar: [
    {
      title: 'Values',
      render: () => (
        <div className="flex max-w-sm flex-col gap-4">
          <ProgressBar label="Uploading" value={40} readout="40%" />
          <ProgressBar label="Almost done" value={90} />
          <ProgressBar label="Working it out" value={null} />
        </div>
      ),
    },
  ],
  WatchedBar: [
    {
      title: 'Part watched',
      render: () => (
        <div className="flex w-48 flex-col gap-3">
          <WatchedBar watched={0.2} />
          <WatchedBar watched={0.65} />
        </div>
      ),
    },
  ],
  Skeleton: [
    {
      title: 'Shapes',
      render: () => (
        <div className="flex items-center gap-4">
          <Skeleton shape="card" className="h-24 w-40" />
          <Skeleton shape="soft" className="h-4 w-40" />
          <Skeleton shape="round" className="size-12" />
        </div>
      ),
    },
  ],
  Callout: [
    {
      title: 'Tones',
      render: () => (
        <div className="flex flex-col gap-3">
          <Callout title="Heads up" icon={Info}>
            Something worth knowing.
          </Callout>
          <Callout title="Running low on space" tone="warning">
            12 GB left on the media drive.
          </Callout>
          <Callout
            title="The transcoder stopped"
            tone="danger"
            action={
              <Button variant="secondary" size="sm">
                Restart
              </Button>
            }
          />
        </div>
      ),
    },
  ],
  NothingHere: [
    {
      title: 'An empty list',
      render: () => (
        <NothingHere
          of={Film}
          title="No films yet"
          detail="Add a library to start."
          action={<Button variant="secondary">Add a library</Button>}
        />
      ),
    },
  ],
  CouldNotRead: [
    {
      title: 'A failed read',
      render: () => <CouldNotRead said="Your requests could not be read." onTryAgain={nothing} />,
    },
  ],
  AgeRating: [
    {
      title: 'Boards',
      render: () => (
        <div className="flex items-center gap-2">
          <AgeRating certification="12A" region="GB" />
          <AgeRating certification="15" region="GB" />
          <AgeRating certification="PG-13" region="US" />
          <AgeRating certification="R" region="US" size="md" />
        </div>
      ),
    },
  ],
  TomatoMark: [
    {
      title: 'Fresh and rotten',
      render: () => (
        <div className="flex items-center gap-3">
          <TomatoMark score={92} />
          <TomatoMark score={31} />
        </div>
      ),
    },
  ],
  Toaster: [
    {
      title: 'Each kind of notice',
      render: () => <ToasterDemo />,
    },
  ],
  SplashScreen: [
    {
      title: 'Starting up, in a frame',
      render: () => <SplashScreenDemo />,
    },
  ],
};

export { FEEDBACK_EXAMPLES };
