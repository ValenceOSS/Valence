import { askForWebGlRenderer } from '@ValenceUI/askForWebGlRenderer';

const DRAWN_IN_SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/iu;

/**
 * Whether this browser draws with a graphics card rather than on the processor. Asked once, before
 * anything is drawn, so a page can turn its moving light, blurred glass and running bands down on a
 * machine that would otherwise stutter through them. No to a browser that refuses WebGL on the
 * condition that it be fast, and no to one that names a software renderer. Answers no where there
 * is no document.
 *
 * @param ask - How the browser is asked for its renderer, which a test can answer itself.
 * @returns Whether drawing is done by the graphics card.
 */
const hasHardwareGraphics = (ask: () => string | null = askForWebGlRenderer): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  const renderer = ask();

  return renderer !== null && !DRAWN_IN_SOFTWARE.test(renderer);
};

export { hasHardwareGraphics };
