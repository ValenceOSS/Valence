import { ROUNDNESS_SCALES } from '@ValenceContracts/schemas/Roundness';
import { tokens } from '@ValenceTv/theme/tokens';

describe('tokens', () => {
  it('draws with the palette', () => {
    expect(tokens.colours.canvas).toBe('#0d0d0d');
    expect(tokens.colours.onWhite).toBe('#000000');
  });

  it('accents in white, as the web paints its primary, never in blue', () => {
    expect(tokens.colours.accent).toBe('#fafafa');
    expect(tokens.colours.accent).not.toBe('#3a8ee8');
    expect(tokens.colours.onAccent).toBe('#0d0d0d');
    expect(tokens.colours.onDanger).toBe('#fcfcfc');
  });

  it('keeps the line and the faint line as one', () => {
    expect(tokens.colours.faint).toBe(tokens.colours.line);
  });

  it('doubles the corners of the web, at its default roundness, and the focus ring to be read across the room', () => {
    expect(tokens.ACROSS_THE_ROOM).toBe(2);
    expect(ROUNDNESS_SCALES.default).toBe(1.6);
    expect(tokens.radii.xs).toBe(13);
    expect(tokens.radii.lg).toBe(26);
    expect(tokens.radii.xxl).toBe(38);
    expect(tokens.FOCUS_RING).toBe(6);
  });

  it('grows spacing and type from small to large', () => {
    const spaces = Object.values(tokens.space);
    const sizes = Object.values(tokens.type);

    expect(spaces).toEqual([...spaces].sort((one, other) => one - other));
    expect(sizes).toEqual([...sizes].sort((one, other) => other - one));
  });
});
