/**
 * The names a release's title gives: the whole of it, and each part of one that names the title in
 * several languages, such as `间谍过家家 / SPY×FAMILY` or `Название | Title`, or that gives a second
 * name in brackets after the first, as `Tantei wa Mou, Shindeiru (The Detective Is Already Dead)`.
 *
 * @param title - The title the release gives.
 * @returns Each name in it, the whole first.
 */
const namesInTitle = (title: string): string[] => {
  const bracketed = /^(?<before>.*\S)\s*\((?<inside>[^()]*\p{L}[^()]*)\)$/u.exec(title)?.groups;

  return [
    ...new Set([
      title,
      ...title
        .split(/\s+[/|]\s+/)
        .map((part) => part.trim())
        .filter((part) => part !== ''),
      ...(bracketed?.['before'] === undefined || bracketed['inside'] === undefined
        ? []
        : [bracketed['before'].trim(), bracketed['inside'].trim()]),
    ]),
  ];
};

export { namesInTitle };
