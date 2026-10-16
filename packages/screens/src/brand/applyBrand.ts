import type { Brand } from '@ValenceContracts/schemas/Brand';
import { say } from '@ValenceI18n/say';

const STYLE_ID = 'valence-brand';

const VALENCE_ICON = '/icon.png';

/**
 * Whether a colour is light enough that words on it should be dark.
 *
 * @param hex - The colour, as `#rrggbb`.
 * @returns Whether it is light.
 */
const isLight = (hex: string): boolean => {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));

  return (red * 299 + green * 587 + blue * 114) / 1000 > 150;
};

/**
 * Finds the element in the document's head that something is said in, making it where it is not
 * there yet.
 *
 * @param doc - The document.
 * @param selector - What finds it.
 * @param make - How to make it.
 * @returns The element.
 */
const headElement = <T extends Element>(doc: Document, selector: string, make: () => T): T => {
  const found = doc.head.querySelector<T>(selector);

  if (found !== null) {
    return found;
  }

  const made = make();

  doc.head.append(made);

  return made;
};

/**
 * Puts the server's own name, description, icon and accent on the document in place of Valence's,
 * or puts Valence's back where the server has none. The accent is written as a stylesheet rather than
 * on the document element, so a theme somebody chose from a plugin still has the last word.
 *
 * @param brand - The server's own brand.
 * @param doc - The document to mark, which is the real one in everything but a test.
 */
const applyBrand = (brand: Brand, doc: Document = document): void => {
  doc.title = brand.name ?? say('common.valence');

  const description = doc.head.querySelector('meta[name="description"]');

  if (brand.description === null) {
    description?.remove();
  } else {
    headElement(doc, 'meta[name="description"]', () => {
      const made = doc.createElement('meta');

      made.name = 'description';

      return made;
    }).content = brand.description;
  }

  headElement(doc, 'link[rel="icon"]', () => {
    const made = doc.createElement('link');

    made.rel = 'icon';

    return made;
  }).href = brand.logo ?? VALENCE_ICON;

  const style = doc.getElementById(STYLE_ID);

  if (brand.accent === null) {
    style?.remove();

    return;
  }

  const sheet =
    style ??
    headElement(doc, `#${STYLE_ID}`, () => {
      const made = doc.createElement('style');

      made.id = STYLE_ID;

      return made;
    });

  // oxlint-disable-next-line valence/no-hard-coded-strings -- a stylesheet, not words anybody reads
  sheet.textContent = `:root{--color-accent:${brand.accent};--color-accent-hover:color-mix(in oklab, ${brand.accent} 85%, black);--color-accent-contrast:${isLight(brand.accent) ? '#0e0e0e' : '#ffffff'}}`;
};

export { applyBrand };
