/**
 * The names a release's title gives: the whole of it, and each part of one that names the title in
 * several languages, such as `间谍过家家 / SPY×FAMILY` or `Название | Title`.
 *
 * @param title - The title the release gives.
 * @returns Each name in it, the whole first.
 */
const namesInTitle = (title: string): string[] => [
  ...new Set([
    title,
    ...title
      .split(/\s+[/|]\s+/)
      .map((part) => part.trim())
      .filter((part) => part !== ''),
  ]),
];

export { namesInTitle };
