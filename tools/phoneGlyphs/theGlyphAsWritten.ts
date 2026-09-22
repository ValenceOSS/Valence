import type { ADrawing } from './theDrawingOf';

const THE_COLOUR_IT_INHERITS = 'currentColor';

const asAComponent = (tag: string): string => `${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;

const asProps = (attributes: Record<string, string>): string =>
  Object.entries(attributes)
    .map(([name, value]) =>
      value === THE_COLOUR_IT_INHERITS ? `${name}={colour}` : `${name}="${value}"`,
    )
    .join(' ');

/**
 * Writes one icon as the component a phone draws it with.
 *
 * Components rather than markup, because markup in a string is a drawing nothing can check: a
 * mistyped shape is found by somebody looking at a screen instead of by the compiler. These are the
 * same thing the set hands a browser, said in the words React Native knows.
 *
 * Whatever the set drew in the colour it inherits is drawn in the colour it is given, which is the
 * one thing about an icon that belongs to whoever asked for it rather than to the icon.
 *
 * @param name - The icon, named as the set exports it.
 * @param drawing - What it is drawn with, and what it is drawn from.
 * @returns The module to write.
 */
const theGlyphAsWritten = (name: string, drawing: ADrawing): string => {
  const shapes = [...new Set(drawing.parts.map((part) => asAComponent(part.tag)))].sort();
  const drawn = drawing.parts
    .map((part) => `    <${asAComponent(part.tag)} ${asProps(part.attributes)} />`)
    .join('\n');

  return `import { Svg, ${shapes.join(', ')} } from 'react-native-svg';
import type { GlyphProps } from '@ValencePhone/components/Icon/Icon.types';

const ${name} = ({ size, colour }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" ${asProps(drawing.attributes)}>
${drawn}
  </Svg>
);

${name}.displayName = '${name}';

export { ${name} };
`;
};

export { theGlyphAsWritten };
