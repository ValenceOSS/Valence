import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { JobsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/JobsVignette/components/JobsScene/JobsScene';

/**
 * The admin's jobs and their schedules, acted out round and round by a pointer that runs the
 * library scan by hand.
 */
const JobsVignette = () => (
  <LoopingScene scene={JobsScene} frames={260} anchor="left" still={120} startsAt={0} />
);

JobsVignette.displayName = 'JobsVignette';

export { JobsVignette };
