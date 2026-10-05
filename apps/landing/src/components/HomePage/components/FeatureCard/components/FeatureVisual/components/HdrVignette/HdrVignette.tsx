import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { HdrScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HdrVignette/components/HdrScene/HdrScene';

/**
 * One scene at dusk with its highlights clipped flat on one side and kept on the other, the line
 * between them sweeping across and back round and round.
 */
const HdrVignette = () => (
  <div className="valence-card-shell w-full max-w-[var(--vignette-width)] shadow-[var(--shadow-lifted)]">
    <LoopingScene scene={HdrScene} frames={240} width={416} height={234} still={100} />
  </div>
);

HdrVignette.displayName = 'HdrVignette';

export { HdrVignette };
