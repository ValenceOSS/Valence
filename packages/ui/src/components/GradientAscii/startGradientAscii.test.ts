import { describe, expect, it } from 'vitest';
import { startGradientAscii } from './startGradientAscii';
import type { GradientAsciiLook } from './GradientAscii.types';

const LOOK: GradientAsciiLook = {
  colours: ['#0a3f9e', '#0066ff'],
  shape: 'horizon',
  characters: ' .:',
  cellSize: 18,
  density: 0.8,
  glyphOpacity: 0.85,
  glow: 0.2,
  flicker: 0.2,
  softness: 0.5,
  flow: 0.5,
  speed: 1,
  gradientOpacity: 0.9,
  grain: 0.08,
  fontFamily: 'monospace',
  isStill: false,
  isInteractive: true,
};

describe('startGradientAscii', () => {
  it('draws nothing where the browser has no WebGL 2', () => {
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');

    expect(startGradientAscii(container, canvas, () => LOOK)).toBeNull();
  });
});
