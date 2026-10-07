import { afterEach, describe, expect, it, vi } from 'vitest';
import { askForWebGlRenderer } from './askForWebGlRenderer';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('askForWebGlRenderer', () => {
  it('says nothing where WebGL is refused on the condition that it be fast', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    expect(askForWebGlRenderer()).toBeNull();
    expect(getContext).toHaveBeenCalledWith('webgl', { failIfMajorPerformanceCaveat: true });
  });
});
