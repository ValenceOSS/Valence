/**
 * Asks the browser for WebGL on condition that it would not be slow, and says what is drawing it.
 * A browser that would have to draw in software refuses the condition, and one that keeps its
 * renderer's name to itself answers with an empty name. The context is let go straight after.
 *
 * @returns The renderer's name, empty where it is not told, or null where WebGL was refused.
 */
const askForWebGlRenderer = (): string | null => {
  const gl = document
    .createElement('canvas')
    .getContext('webgl', { failIfMajorPerformanceCaveat: true });

  if (gl === null) {
    return null;
  }

  const debug = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debug === null ? '' : String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL));

  gl.getExtension('WEBGL_lose_context')?.loseContext();

  return renderer;
};

export { askForWebGlRenderer };
