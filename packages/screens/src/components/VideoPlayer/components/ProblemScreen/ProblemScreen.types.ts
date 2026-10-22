import type { DescribedProblem } from '@ValenceClient/playback/describePlaybackProblem';

type ProblemScreenProps = {
  problem: DescribedProblem | null;
  details: string;
  onRetry?: () => void;
  onSignIn?: () => void;
};

export type { ProblemScreenProps };
