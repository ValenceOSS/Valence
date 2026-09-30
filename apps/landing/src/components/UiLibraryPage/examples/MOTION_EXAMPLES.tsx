import { Bell, Heart, Settings } from '@keyline-icons/react';
import { AnimatedIcon } from '@ValenceUI/AnimatedIcon';
import { Icon } from '@ValenceUI/Icon';
import { Reveal } from '@ValenceUI/Reveal';
import { RevealItem } from '@ValenceUI/RevealItem';
import { AnimatedNumberDemo } from '@ValenceLanding/components/UiLibraryPage/examples/demos/AnimatedNumberDemo';
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
  AnimatedNumber: [
    {
      title: 'Rolls between values',
      render: () => <AnimatedNumberDemo />,
    },
  ],
  MoodBackground: [
    {
      title: 'Lit in three moods',
      render: () => <MoodBackgroundDemo />,
    },
  ],
};

export { MOTION_EXAMPLES };
