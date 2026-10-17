type ReleaseSection = {
  heading: string;
  items: string[];
};

const LINK = /\[([^\]]*)\]\([^)]*\)/g;

const REFERENCES = /\s*\((?:\[[^\]]*\]\([^)]*\)|#\d+|[0-9a-f]{7,40})\)/g;

/**
 * Reads the notes GitHub keeps for a release into sections of plain points, dropping the links to
 * issues and commits and the markup, so they can be shown without rendering anything from outside.
 *
 * @param notes - The release's notes, as written.
 * @returns Each section's heading and its points, in order.
 */
const readReleaseNotes = (notes: string): ReleaseSection[] => {
  const sections: ReleaseSection[] = [];

  for (const line of notes.split('\n')) {
    const heading = /^#{3,}\s+(.+)$/.exec(line.trim());

    if (heading !== null) {
      sections.push({ heading: (heading[1] ?? '').replace(LINK, '$1').trim(), items: [] });

      continue;
    }

    const point = /^[*-]\s+(.+)$/.exec(line.trim());

    if (point !== null) {
      const text = (point[1] ?? '')
        .replace(REFERENCES, '')
        .replace(LINK, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .trim();
      const section = sections.at(-1);

      if (section === undefined) {
        sections.push({ heading: '', items: [text] });
      } else {
        section.items.push(text);
      }
    }
  }

  return sections.filter((section) => section.items.length > 0);
};

export type { ReleaseSection };

export { readReleaseNotes };
