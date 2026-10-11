import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPicturePresenter } from '@ValenceScreens/playback/engine/createPicturePresenter';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPicturePresenter', () => {
  it('has nothing to draw with in a browser without WebGPU', async () => {
    expect(await createPicturePresenter(document.createElement('canvas'), vi.fn())).toBeNull();
  });

  it('has nothing to draw with where the browser offers no GPU', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      gpu: { requestAdapter: () => Promise.resolve(null) },
    });

    expect(await createPicturePresenter(document.createElement('canvas'), vi.fn())).toBeNull();
  });
});
