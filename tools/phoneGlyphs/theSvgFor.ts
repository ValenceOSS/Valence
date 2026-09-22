const AN_EXPORT = (name: string) =>
  new RegExp(`export function ${name}\\(props\\) \\{[\\s\\S]*?\\n\\}`, 'u');

const AN_ELEMENT = /_jsx\("(?<tag>[a-z]+)", \{(?<attributes>[^}]*)\}\)/gu;

const AN_ATTRIBUTE = /(?<name>[A-Za-z]+): (?<value>"[^"]*"|[\d.]+)/gu;

const asAnAttributeName = (name: string): string =>
  name.replaceAll(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

const asMarkup = (attributes: string): string =>
  [...attributes.matchAll(AN_ATTRIBUTE)]
    .map(({ groups }) => {
      const name = groups?.['name'] ?? '';
      const value = (groups?.['value'] ?? '').replaceAll('"', '');

      return `${asAnAttributeName(name)}="${value}"`;
    })
    .join(' ');

/**
 * Lifts one icon out of the set Valence draws everywhere else, as markup anything can render.
 *
 * The set publishes React components that return `<svg>`, which a phone cannot use: React Native
 * has no such element. Rather than draw a second set of icons for one client, or trust somebody
 * else's copy of this one, the drawing is taken out of the components themselves. They are
 * generated from one grid and have one shape, so reading them is reading a table rather than
 * parsing a language.
 *
 * @param source - The set's built module.
 * @param name - The icon, named as the set exports it.
 * @returns The icon as a whole SVG document, its colour left as `currentColor`.
 */
const theSvgFor = (source: string, name: string): string => {
  const found = AN_EXPORT(name).exec(source);

  if (found === null) {
    throw new Error(`The icon set has no ${name}.`);
  }

  const [block] = found;
  const root = /_jsx\w*\(Icon, \{(?<attributes>[^}]*?), \.\.\.props/u.exec(block);

  if (root === null) {
    throw new Error(`${name} is not drawn the way every other icon in the set is.`);
  }

  const children = [...block.matchAll(AN_ELEMENT)]
    .map(({ groups }) => `<${groups?.['tag'] ?? ''} ${asMarkup(groups?.['attributes'] ?? '')}/>`)
    .join('');

  if (children === '') {
    throw new Error(`${name} draws nothing.`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${asMarkup(
    root.groups?.['attributes'] ?? '',
  )}>${children}</svg>`;
};

export { theSvgFor };
