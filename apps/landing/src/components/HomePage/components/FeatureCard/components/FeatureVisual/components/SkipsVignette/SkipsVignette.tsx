import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { SkipsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SkipsVignette/components/SkipsScene/SkipsScene';

/**
 * An episode playing with its intro found, acted out round and round: the skip is offered, pressed,
 * and the playhead jumps past the intro.
 */
const SkipsVignette = () => (
  <LoopingScene scene={SkipsScene} frames={240} still={60} startsAt={160} anchor="right" />
);

SkipsVignette.displayName = 'SkipsVignette';

export { SkipsVignette };
