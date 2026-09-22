type APart = {
  tag: string;
  attributes: Record<string, string>;
};

type ADrawing = {
  attributes: Record<string, string>;
  parts: APart[];
};

const AN_EXPORT = (name: string) =>
  new RegExp(`export function ${name}\\(props\\) \\{[\\s\\S]*?\\n\\}`, 'u');

const AN_ELEMENT = /_jsx\("(?<tag>[a-z]+)", \{(?<attributes>[^}]*)\}\)/gu;

const AN_ATTRIBUTE = /(?<name>[A-Za-z]+): (?<value>"[^"]*"|[\d.]+)/gu;

const asRead = (attributes: string): Record<string, string> =>
  Object.fromEntries(
    [...attributes.matchAll(AN_ATTRIBUTE)].map(({ groups }) => [
      groups?.['name'] ?? '',
      (groups?.['value'] ?? '').replaceAll('"', ''),
    ]),
  );

/**
 * Lifts one icon out of the set Valence draws everywhere else, as the shapes it is made of.
 *
 * The set publishes React components that return `<svg>`, which a phone cannot use: React Native
 * has no such element. Rather than draw a second set of icons for one client, or trust somebody
 * else's copy of this one, the drawing is taken out of the components themselves. They are
 * generated from one grid and have one shape, so reading them is reading a table rather than
 * parsing a language.
 *
 * Answers with the parts rather than with markup, because what is written from this is components
 * — the same thing the set gives a browser, said in the words a phone knows.
 *
 * @param source - The set's built module.
 * @param name - The icon, named as the set exports it.
 * @returns What the icon is drawn with, and what it is drawn from.
 */
const theDrawingOf = (source: string, name: string): ADrawing => {
  const found = AN_EXPORT(name).exec(source);

  if (found === null) {
    throw new Error(`The icon set has no ${name}.`);
  }

  const [block] = found;
  const root = /_jsx\w*\(Icon, \{(?<attributes>[^}]*?), \.\.\.props/u.exec(block);

  if (root === null) {
    throw new Error(`${name} is not drawn the way every other icon in the set is.`);
  }

  const parts = [...block.matchAll(AN_ELEMENT)].map(({ groups }) => ({
    tag: groups?.['tag'] ?? '',
    attributes: asRead(groups?.['attributes'] ?? ''),
  }));

  if (parts.length === 0) {
    throw new Error(`${name} draws nothing.`);
  }

  return { attributes: asRead(root.groups?.['attributes'] ?? ''), parts };
};

export type { ADrawing, APart };

export { theDrawingOf };
