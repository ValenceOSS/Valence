import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { ContractScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ContractVignette/components/ContractScene/ContractScene';

/**
 * A route declared as a contract, acted out round and round by a pointer.
 */
const ContractVignette = () => (
  <LoopingScene
    scene={ContractScene}
    frames={246}
    width={323}
    height={280}
    still={126}
    startsAt={90}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

ContractVignette.displayName = 'ContractVignette';

export { ContractVignette };
