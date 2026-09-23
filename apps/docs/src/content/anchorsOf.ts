/**
 * The anchors a page's headings get when it is built, worked out from its source the way
 * `rehype-slug` does: lower case, punctuation dropped, spaces as hyphens, and a number after a
 * heading that repeats an earlier one, counting on past any anchor already given. Headings inside
 * code are not headings.
 *
 * @param source - The page, as MDX.
 * @returns Its anchors.
 */
const anchorsOf = (source: string): Set<string> => {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  let isInCode = false;

  for (const line of source.split('\n')) {
    if (line.startsWith('```')) {
      isInCode = !isInCode;
      continue;
    }

    const heading = isInCode ? null : /^#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line)?.[1];

    if (heading === undefined || heading === null) {
      continue;
    }

    const slug = heading
      .replace(/`([^`]*)`/gu, '$1')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/gu, '-');
    let anchor = slug;

    while (seen.has(anchor)) {
      const times = (seen.get(slug) ?? 0) + 1;

      seen.set(slug, times);
      anchor = `${slug}-${times.toString()}`;
    }

    seen.set(anchor, 0);
    anchors.add(anchor);
  }

  return anchors;
};

export { anchorsOf };
