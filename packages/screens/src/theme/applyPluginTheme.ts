import { OWNED } from '@ValenceClient/plugins/pluginThemeProperties';

/**
 * Puts a plugin theme's colours and corners on the document, or takes them all off again. Each is
 * set as one custom property through the style API, never written into a stylesheet, so a value can
 * only ever be the value of that one property.
 *
 * @param properties - Each property and its value, or nothing to go back to Valence's own.
 * @param root - The element to mark, which is the document's own in everything but a test.
 */
const applyPluginTheme = (
  properties: Record<string, string> | null,
  root: HTMLElement = document.documentElement,
): void => {
  for (const property of OWNED) {
    if (property !== '--radius-scale') {
      root.style.removeProperty(property);
    }
  }

  if (properties === null) {
    delete root.dataset['pluginTheme'];

    return;
  }

  for (const [property, value] of Object.entries(properties)) {
    if (OWNED.includes(property)) {
      root.style.setProperty(property, value);
    }
  }

  root.dataset['pluginTheme'] = 'on';
};

export { applyPluginTheme };
