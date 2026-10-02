import type { XmlElement } from './readXmlElements';

/**
 * Every element of a name anywhere in a tree, outermost first.
 *
 * @param elements - The tree.
 * @param name - The element's name, matched without regard to case.
 * @returns The elements found.
 */
const findXmlElements = (elements: readonly XmlElement[], name: string): XmlElement[] =>
  elements.flatMap((element) => [
    ...(element.name.toLowerCase() === name.toLowerCase() ? [element] : []),
    ...findXmlElements(element.children, name),
  ]);

export { findXmlElements };
