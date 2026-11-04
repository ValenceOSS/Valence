import { Bell, Heart, Settings } from '@keyline-icons/react';
import { AnimatedIcon } from '@ValenceUI/AnimatedIcon';
import { AuroraBackdrop } from '@ValenceUI/AuroraBackdrop';
import { Doodle } from '@ValenceUI/Doodle';
import { FoldGradient } from '@ValenceUI/FoldGradient';
import { GradientAscii } from '@ValenceUI/GradientAscii';
import { WordReveal } from '@ValenceUI/WordReveal';
import { Icon } from '@ValenceUI/Icon';
import { Reveal } from '@ValenceUI/Reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { FormattedNumberDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/FormattedNumberDemo';
import { HoverHighlightDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/HoverHighlightDemo';
import { MoodBackgroundDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/MoodBackgroundDemo';
import { SlidingMarkDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/SlidingMarkDemo';
import type { UiExample } from './UiExample.types';

const MOTION_EXAMPLES: Readonly<Record<string, readonly UiExample[]>> = {
  AnimatedIcon: [
    {
      title: 'Gestures, playing',
      render: () => (
        <div className="flex items-center gap-6">
          <AnimatedIcon gesture="spin" isPlaying icon={<Icon of={Settings} size={22} />} />
          <AnimatedIcon gesture="ring" isPlaying icon={<Icon of={Bell} size={22} />} />
          <AnimatedIcon gesture="fill" isPlaying icon={<Icon of={Heart} size={22} />} />
        </div>
      ),
    },
  ],
  Reveal: [
    {
      title: 'Rises in as it enters the page',
      render: () => (
        <Reveal>
          <p className="text-sm text-text-muted">This paragraph rose in.</p>
        </Reveal>
      ),
    },
  ],
  RevealItem: [
    {
      title: 'Staggered cards',
      render: () => (
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((index) => (
            <RevealItem key={index} index={index}>
              <div className="valence-surface size-16 rounded-xl" />
            </RevealItem>
          ))}
        </div>
      ),
    },
  ],
  HoverHighlight: [
    {
      title: 'Follows the pointer down a list',
      render: () => <HoverHighlightDemo />,
    },
  ],
  SlidingMark: [
    {
      title: 'Glides to the chosen one',
      render: () => <SlidingMarkDemo />,
    },
  ],
  FormattedNumber: [
    {
      title: 'Rolls between values',
      render: () => <FormattedNumberDemo />,
    },
  ],
  MoodBackground: [
    {
      title: 'Lit in three moods',
      render: () => <MoodBackgroundDemo />,
    },
  ],
  AuroraBackdrop: [
    {
      title: 'Behind a page, held in a frame',
      render: () => (
        <div className="relative isolate flex h-40 w-full items-center justify-center overflow-hidden rounded-xl">
          <AuroraBackdrop />
          <span className="text-sm text-text">Welcome back</span>
        </div>
      ),
    },
  ],
  FoldGradient: [
    {
      title: 'A folding ribbon of colour',
      render: () => (
        <div className="relative h-40 w-full overflow-hidden rounded-xl">
          <FoldGradient className="absolute inset-0" />
        </div>
      ),
    },
  ],
  GradientAscii: [
    {
      title: 'A gradient drawn in characters',
      render: () => (
        <div className="relative h-40 w-full overflow-hidden rounded-xl bg-[var(--surface-hover)]">
          <GradientAscii className="absolute inset-0" shape="horizon" />
        </div>
      ),
    },
  ],
  Doodle: [
    {
      title: 'Each hand-drawn mark',
      render: () => (
        <div className="flex flex-wrap items-center gap-6 text-accent">
          {(['arrowCurl', 'arrowDown', 'circle', 'sparks', 'underline'] as const).map((name) => (
            <Doodle key={name} of={name} isShown className="h-12 w-16" />
          ))}
        </div>
      ),
    },
  ],
  WordReveal: [
    {
      title: 'A word written in',
      render: () => (
        <p className="text-3xl font-semibold text-text">
          Watch it <WordReveal word="together" isShown hasArrived />
        </p>
      ),
    },
  ],
};

export { MOTION_EXAMPLES };
