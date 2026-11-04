const GECKO = /\bGecko\/\d/;

/**
 * Whether this browser starts an HEVC picture only from an IDR keyframe once its Media Source buffer
 * has been reset, which Firefox and every browser built on Gecko does.
 *
 * Asked of the engine's name because nothing else answers it. `isTypeSupported` says yes to HEVC,
 * and the refusal only shows when a segment opening on a CRA keyframe is appended after a reset: the
 * append is reported as done and the buffer simply never grows. Measured in Zen on macOS against an
 * open-GOP x265 episode, the first segment played and every later one was dropped, while Chromium
 * took the same segments after the same resets. H.264's open-GOP keyframes it takes either way.
 * Chromium and WebKit call themselves "like Gecko", with no version after it, so only Gecko itself
 * matches.
 *
 * @param userAgent - What the browser calls itself.
 * @returns Whether a copied film has to open on IDR keyframes to play here.
 */
const needsIdrKeyframes = (userAgent: string): boolean => GECKO.test(userAgent);

export { needsIdrKeyframes };
