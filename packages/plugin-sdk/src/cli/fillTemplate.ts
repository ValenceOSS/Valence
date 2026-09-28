/**
 * Fills the `{id}`, `{version}` and `{file}` holes in an address template.
 *
 * @param template - The address, such as `https://example.com/{id}/{file}`.
 * @param values - What goes in each hole.
 * @returns The address with every hole filled.
 */
const fillTemplate = (template: string, values: { id: string; version: string; file: string }): string =>
  template
    .replaceAll('{id}', encodeURIComponent(values.id))
    .replaceAll('{version}', encodeURIComponent(values.version))
    .replaceAll('{file}', encodeURIComponent(values.file));

export { fillTemplate };
