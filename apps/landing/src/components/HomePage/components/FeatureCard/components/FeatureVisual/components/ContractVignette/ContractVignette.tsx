import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { ContractScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ContractVignette/components/ContractScene/ContractScene';

/**
 * A route declared as a contract, acted out round and round by a pointer.
 */
const ContractVignette = () => (
  <LoopingScene scene={ContractScene} frames={246} still={126} startsAt={90} anchor="left" />
);

ContractVignette.displayName = 'ContractVignette';

export { ContractVignette };
