import { describe, expect, it } from 'vitest';
import { hasHardwareGraphics } from './hasHardwareGraphics';

describe('hasHardwareGraphics', () => {
  it('agrees where a graphics card is named', () => {
    expect(hasHardwareGraphics(() => 'ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro)')).toBe(
      true,
    );
  });

  it('agrees where the browser keeps the name to itself but gave WebGL anyway', () => {
    expect(hasHardwareGraphics(() => '')).toBe(true);
  });

  it('declines where WebGL was refused for being slow', () => {
    expect(hasHardwareGraphics(() => null)).toBe(false);
  });

  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
  ])('declines where the renderer is a software one: %s', (renderer) => {
    expect(hasHardwareGraphics(() => renderer)).toBe(false);
  });
});
