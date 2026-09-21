type ChainShape = 'preview' | 'sheet' | 'transcode';

type VerifiedChain = {
  accel: string;
  shape: ChainShape;
  bitDepth: number;
  works: boolean;
};

const EIGHT_BIT = 8;

const TEN_BIT = 10;

/**
 * Whether a shape of filter chain is one this server proved it can run at this depth.
 *
 * The media service runs the real graph at startup — four frames, the real filters, the real
 * encoder, at both depths — and records what came back. Asking it afterwards costs nothing, since
 * the measuring already happened.
 *
 * Unverified means yes, which is the same answer the media service gives itself. A machine nobody
 * probed is the state everything was in before the probing existed, and refusing to play there
 * would be a worse answer than trying.
 *
 * Depth is asked as the source's, not the chain's: anything above eight bits is a ten bit chain and
 * everything else is an eight bit one, because those are the two that were measured.
 *
 * @param chains - What the media service verified at startup.
 * @param accel - The acceleration being considered.
 * @param shape - The kind of work the chain would do.
 * @param bitDepth - How deep the source is, where that is known.
 * @returns Whether this machine will run it.
 */
const chainRunsHere = (
  chains: readonly VerifiedChain[],
  accel: string,
  shape: ChainShape,
  bitDepth?: number | null,
): boolean => {
  const depth = typeof bitDepth === 'number' && bitDepth > EIGHT_BIT ? TEN_BIT : EIGHT_BIT;

  const found = chains.find(
    (chain) => chain.accel === accel && chain.shape === shape && chain.bitDepth === depth,
  );

  return found === undefined || found.works;
};

export type { ChainShape, VerifiedChain };

export { chainRunsHere };
