import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { SkipsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SkipsVignette/components/SkipsScene/SkipsScene';

/**
 * An episode playing with its intro found, acted out round and round: the skip is offered, pressed,
 * and the playhead jumps past the intro.
 */
const SkipsVignette = () => (
  <div className="valence-card-shell w-full max-w-[var(--vignette-width)] shadow-[var(--shadow-lifted)]">
    <LoopingScene scene={SkipsScene} frames={240} width={416} height={234} still={60} />
  </div>
);

SkipsVignette.displayName = 'SkipsVignette';

export { SkipsVignette };
