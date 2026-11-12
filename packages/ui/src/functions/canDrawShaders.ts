type Drawing = {
  getExtension: (name: 'WEBGL_lose_context') => { loseContext: () => void } | null;
} | null;

/**
 * Whether this browser can draw the page's shaders at all, which need WebGL 2; a browser without it
 * is left the plain colour behind them rather than an error. The context asked for is let go straight
 * after. Answers no where there is no document.
 *
 * @param ask - How the browser is asked for WebGL 2, which a test can answer itself.
 * @returns Whether shaders can be drawn.
 */
const canDrawShaders = (
  ask: () => Drawing = () => document.createElement('canvas').getContext('webgl2'),
): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }

  const gl = ask();

  if (gl === null) {
    return false;
  }

  gl.getExtension('WEBGL_lose_context')?.loseContext();

  return true;
};

export { canDrawShaders };
