import type { DescribedProblem } from '@ValenceClient/playback/describePlaybackProblem';

type PlaybackProblemProps = {
  problem: DescribedProblem;
  onLeave: () => void;
  onRetry?: () => void;
  onSignIn?: () => void;
};

export type { PlaybackProblemProps };
