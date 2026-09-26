import { requireOptionalNativeModule } from 'expo';

type AStatusFrame = { x: number; y: number; width: number; height: number };

type NativeSideStrip = {
  statusFrame: () => Promise<AStatusFrame | null>;
};

/**
 * Where the system draws its status — the clock, the signal and the battery — in the window, which
 * a folding phone moves into a strip down the side of its screen.
 *
 * @returns Its frame, or nothing where the status is hidden or this phone cannot say.
 */
const whereTheStatusIs = async (): Promise<AStatusFrame | null> => {
  const strip = requireOptionalNativeModule<NativeSideStrip>('ValenceSideStrip');

  return strip === null ? null : strip.statusFrame();
};

export { whereTheStatusIs };
