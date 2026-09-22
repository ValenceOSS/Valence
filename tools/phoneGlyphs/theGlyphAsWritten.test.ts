import { describe, expect, it } from 'vitest';
import { theGlyphAsWritten } from './theGlyphAsWritten';

const A_DRAWING = {
  attributes: { fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
  parts: [{ tag: 'path', attributes: { d: 'M6 6L18 12Z' } }],
};

describe('theGlyphAsWritten', () => {
  it('writes a component, not a picture in a string', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('const Play = ({ size, colour }');
  });

  it('draws on the same grid the rest of Valence draws on', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('viewBox="0 0 24 24"');
  });

  it('keeps the shape', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('<Path d="M6 6L18 12Z" />');
  });

  it('draws it in the colour it was given, not the one it inherited', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('stroke={colour}');
    expect(theGlyphAsWritten('Play', A_DRAWING)).not.toContain('currentColor');
  });

  it('keeps what is not a colour as it was', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('strokeWidth="2"');
  });

  it('brings in every shape it draws with, and each only once', () => {
    const two = {
      ...A_DRAWING,
      parts: [
        { tag: 'path', attributes: { d: 'M1 1' } },
        { tag: 'path', attributes: { d: 'M2 2' } },
        { tag: 'circle', attributes: { cx: '12', cy: '12', r: '9' } },
      ],
    };

    expect(theGlyphAsWritten('Cross', two)).toContain(
      "import { Svg, Circle, Path } from 'react-native-svg';",
    );
  });

  it('names the component so a stack trace says which icon it was', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain("Play.displayName = 'Play';");
  });

  it('exports it by name, as everything here is exported', () => {
    expect(theGlyphAsWritten('Play', A_DRAWING)).toContain('export { Play };');
  });
});
