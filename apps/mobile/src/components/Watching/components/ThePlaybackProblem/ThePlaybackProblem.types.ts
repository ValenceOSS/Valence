import type { DescribedProblem } from '@ValenceClient/playback/describePlaybackProblem';

type ThePlaybackProblemProps = {
  problem: DescribedProblem;
  details: string;
  onClose: () => void;
  onRetry?: () => void;
  onSignIn?: () => void;
};

export type { ThePlaybackProblemProps };
