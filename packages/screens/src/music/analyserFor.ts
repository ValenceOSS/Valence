const FFT_SIZE = 256;

const SMOOTHING = 0.78;

type MaybeAudio = { AudioContext?: typeof AudioContext };

const analysers = new WeakMap<HTMLMediaElement, AnalyserNode>();

/**
 * Whether an element's sound comes from this page's own origin.
 *
 * A browser routes cross-origin media into Web Audio as silence unless the server has agreed to it,
 * so a stream from anywhere else is left alone rather than muted.
 *
 * @param element - The element being played.
 * @returns Whether its source is on the same origin as the page.
 */
const isFromHere = (element: HTMLMediaElement): boolean => {
  try {
    return new URL(element.src, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
};

/**
 * The analyser listening to one element, made the first time it is asked for and kept for as long as
 * the element lives.
 *
 * A browser lets an element be routed into Web Audio once and never again, so it is remembered
 * against the element. Built only when somebody asks — routing cannot be undone, and on some
 * browsers it takes the sound away from AirPlay — so a song nobody watches a visualiser for is played
 * exactly as it always was.
 *
 * @param element - The element being played.
 * @returns Its analyser, or nothing where there is no Web Audio, or the sound is not the page's own.
 */
const analyserFor = (element: HTMLMediaElement): AnalyserNode | null => {
  const found = analysers.get(element);

  if (found !== undefined) {
    return found;
  }

  const source: MaybeAudio = window;

  if (source.AudioContext === undefined || !isFromHere(element)) {
    return null;
  }

  try {
    const engine = new source.AudioContext();
    const analyser = engine.createAnalyser();

    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;

    engine.createMediaElementSource(element).connect(analyser);
    analyser.connect(engine.destination);
    void engine.resume();

    analysers.set(element, analyser);

    return analyser;
  } catch {
    return null;
  }
};

export { analyserFor };
