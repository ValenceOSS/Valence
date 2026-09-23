import { tokens } from '@ValenceTv/theme/tokens';

describe('tokens', () => {
  it('draws with the palette', () => {
    expect(tokens.colours.canvas).toBe('#0d0d0d');
    expect(tokens.colours.accent).toBe('#3a8ee8');
    expect(tokens.colours.faint).toBe(tokens.colours.line);
    expect(tokens.colours.onWhite).toBe('#000000');
  });

  it('doubles corners and the focus ring to be read across the room', () => {
    expect(tokens.ACROSS_THE_ROOM).toBe(2);
    expect(tokens.radii.xs).toBe(8);
    expect(tokens.radii.xxl).toBe(24);
    expect(tokens.FOCUS_RING).toBe(6);
  });

  it('grows spacing and type from small to large', () => {
    const spaces = Object.values(tokens.space);
    const sizes = Object.values(tokens.type);

    expect(spaces).toEqual([...spaces].sort((one, other) => one - other));
    expect(sizes).toEqual([...sizes].sort((one, other) => other - one));
  });
});
