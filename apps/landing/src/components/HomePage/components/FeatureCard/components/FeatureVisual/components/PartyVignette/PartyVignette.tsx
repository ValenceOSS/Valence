import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { PartyScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PartyVignette/components/PartyScene/PartyScene';

/**
 * Three people watching one film who have drifted apart, acted out round and round by a pointer.
 */
const PartyVignette = () => (
  <LoopingScene scene={PartyScene} frames={228} still={112} startsAt={40} anchor="centre" />
);

PartyVignette.displayName = 'PartyVignette';

export { PartyVignette };
