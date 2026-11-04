import { Film, Info } from '@keyline-icons/react';
import { AgeRating } from '@ValenceUI/AgeRating';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Callout } from '@ValenceUI/Callout';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Skeleton } from '@ValenceUI/Skeleton';
import { DoneMark } from '@ValenceUI/DoneMark';
import { FreshnessNote } from '@ValenceUI/FreshnessNote';
import { LiquidFill } from '@ValenceUI/LiquidFill';
import { MorphingRing } from '@ValenceUI/MorphingRing';
import { NoticeCard } from '@ValenceUI/NoticeCard';
import { Spinner } from '@ValenceUI/Spinner';
import { StatusMark } from '@ValenceUI/StatusMark';
import { StatusRing } from '@ValenceUI/StatusRing';
import { StepTrail } from '@ValenceUI/StepTrail';
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
  'ended',
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
  NoticeCard: [
    {
      title: 'Each tone',
      render: () => (
        <div className="flex w-full max-w-sm flex-col gap-3">
          <NoticeCard
            tone="worked"
            title="Saved the library"
            description="Its next scan starts in a moment."
            onDismiss={nothing}
          />
          <NoticeCard
            tone="failed"
            title="The backup failed"
            description="The folder it writes to is full."
            action={{ label: 'Try again', onPress: nothing }}
            onDismiss={nothing}
          />
          <NoticeCard
            tone="working"
            title="Scanning Films"
            tags={['412 of 1,020']}
            onDismiss={nothing}
          />
          <NoticeCard
            tone="info"
            title="Restarting to update"
            countdown={{ seconds: 30, lead: 'Restarting in' }}
            onDismiss={nothing}
          />
        </div>
      ),
    },
  ],
  FreshnessNote: [
    {
      title: 'Checking, and could not check',
      render: () => (
        <div className="flex flex-col items-start gap-3">
          <FreshnessNote isChecking couldNotCheck={false} />
          <FreshnessNote isChecking={false} couldNotCheck />
        </div>
      ),
    },
  ],
  StatusMark: [
    {
      title: 'Each state',
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          {(['loading', 'idle', 'progress', 'done', 'cancelled', 'failed'] as const).map(
            (state) => (
              <StatusMark key={state} state={state} progress={0.6} size={24} label={state} />
            ),
          )}
        </div>
      ),
    },
  ],
  StatusRing: [
    {
      title: 'Each status',
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          {(['pending', 'running', 'done', 'failed', 'cancelled'] as const).map((status) => (
            <StatusRing key={status} status={status} progress={0.6} size={24} />
          ))}
        </div>
      ),
    },
  ],
  DoneMark: [
    {
      title: 'Drawn as a task finishes',
      render: () => (
        <span className="flex items-center gap-2 text-sm text-text">
          <DoneMark />
          Copied
        </span>
      ),
    },
  ],
  LiquidFill: [
    {
      title: 'How full a disk is',
      render: () => (
        <div className="flex gap-3">
          {(
            [
              ['success', 0.3],
              ['warning', 0.75],
              ['danger', 0.95],
            ] as const
          ).map(([tone, level]) => (
            <div
              key={tone}
              className="relative h-28 w-16 overflow-hidden rounded-xl border border-[var(--surface-line)]"
            >
              <LiquidFill tone={tone} level={level} />
            </div>
          ))}
        </div>
      ),
    },
  ],
  MorphingRing: [
    {
      title: 'Filling, then turning',
      render: () => (
        <div className="flex items-center gap-4">
          <MorphingRing size={40} progress={0.35} />
          <MorphingRing size={40} progress={0.8} />
          <MorphingRing size={40} isTurning />
        </div>
      ),
    },
  ],
  StepTrail: [
    {
      title: 'A request on its way',
      render: () => (
        <StepTrail
          label="Request progress"
          className="w-full max-w-md"
          steps={[
            {
              id: 'asked',
              label: 'Asked for',
              mark: 'done',
              aside: { kind: 'note', text: '2 h ago' },
            },
            {
              id: 'found',
              label: 'Found a release',
              mark: 'done',
              lines: [
                { id: 'size', mark: 'quiet', content: '2160p · 14 GB' },
                { id: 'seeds', mark: 'quiet', content: '312 seeders' },
              ],
              isOpenAtFirst: true,
            },
            {
              id: 'downloading',
              label: 'Downloading',
              mark: 'current',
              aside: { kind: 'state', text: '62%', tone: 'accent' },
            },
            { id: 'ready', label: 'Ready to watch', mark: 'waiting' },
          ]}
        />
      ),
    },
  ],
};

export { FEEDBACK_EXAMPLES };
