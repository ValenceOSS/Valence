import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ContractPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ContractVignette/components/ContractPicture/ContractPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 66;

const LETS_GO_AT = 190;

/**
 * The picture acted out by a pointer that calls a route declared as a contract, and the answer it promised arrives, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const ContractScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <ContractPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 88 },
          { at: 24, x: 30, y: 88 },
          { at: ACTS_AT - 6, x: 50, y: 14 },
          { at: ACTS_AT, x: 50, y: 14, isPressing: true },
          { at: LETS_GO_AT - 20, x: 50, y: 14 },
          { at: 245, x: 30, y: 88 },
        ]}
      />
    </AbsoluteFill>
  );
};

ContractScene.displayName = 'ContractScene';

export { ContractScene };
