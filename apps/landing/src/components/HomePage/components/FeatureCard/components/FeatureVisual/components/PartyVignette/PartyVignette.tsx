import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { PartyScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PartyVignette/components/PartyScene/PartyScene';

/**
 * Three people watching one film who have drifted apart, acted out round and round by a pointer.
 */
const PartyVignette = () => (
  <LoopingScene
    scene={PartyScene}
    frames={228}
    width={423}
    height={200}
    still={112}
    startsAt={40}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

PartyVignette.displayName = 'PartyVignette';

export { PartyVignette };
