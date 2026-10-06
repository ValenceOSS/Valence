import { describe, expect, it } from 'vitest';
import { WindowFrameSchema } from './WindowFrame';

describe('WindowFrameSchema', () => {
  it('reads how the window is framed as the desktop app says it', () => {
    expect(WindowFrameSchema.parse({ isMaximised: true, isFullScreen: false })).toEqual({
      isMaximised: true,
      isFullScreen: false,
    });
  });

  it('refuses a frame missing half of what it says', () => {
    expect(WindowFrameSchema.safeParse({ isMaximised: true }).success).toBe(false);
  });
});
