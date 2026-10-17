type ReleasePoint = {
  text: string;
  scope: string | null;
  pull: { number: string; url: string } | null;
  author: string | null;
};

type GroupedKind = 'added' | 'fixed' | 'other';

type ReleaseSection =
  | { kind: 'written'; heading: string; points: ReleasePoint[] }
  | { kind: GroupedKind; points: ReleasePoint[] };

const LINK = /\[([^\]]*)\]\([^)]*\)/g;

const REFERENCES = /\s*\((?:\[[^\]]*\]\([^)]*\)|#\d+|[0-9a-f]{7,40})\)/g;

const LINKED_PULL = /\[#(\d+)\]\((https:\/\/github\.com\/[^)\s]+)\)/;

const WRITTEN_BY = /\s+by\s+@([\w-]+)\s+in\s+(https:\/\/github\.com\/\S+\/pull\/(\d+))\s*$/;

const CONVENTIONAL = /^([a-z]+)(?:\(([^)]+)\))?!?:\s+(.+)$/;

const BOLD_SCOPE = /^\*\*([^*]+):\*\*\s+(.+)$/;

const FIRST_CONTRIBUTION = /^@[\w-]+ made their first contribution/;

const KIND_OF_TYPE: Record<string, GroupedKind> = {
  feat: 'added',
  fix: 'fixed',
  perf: 'fixed',
  revert: 'fixed',
  refactor: 'other',
  docs: 'other',
  style: 'other',
  chore: 'other',
  build: 'other',
  ci: 'other',
  test: 'other',
};

const GROUPED_ORDER: readonly GroupedKind[] = ['added', 'fixed', 'other'];

/**
 * Reads one point of a release's notes into what it says, the part of Valence it is about, the pull
 * request it came from and who wrote it — from either the notes release-please writes or the ones
 * GitHub generates.
 *
 * @param line - The point, without its bullet.
 * @returns The point, and the kind of change its conventional type names, where it names one.
 */
const readPoint = (line: string): { point: ReleasePoint; kind: GroupedKind | null } => {
  let text = line;
  let author: string | null = null;
  let pull: ReleasePoint['pull'] = null;
  let scope: string | null = null;
  let kind: GroupedKind | null = null;

  const written = WRITTEN_BY.exec(text);

  if (written !== null) {
    author = written[1] ?? null;
    pull = { number: written[3] ?? '', url: written[2] ?? '' };
    text = text.slice(0, written.index);
  }

  const linked = LINKED_PULL.exec(text);

  if (pull === null && linked !== null) {
    pull = { number: linked[1] ?? '', url: linked[2] ?? '' };
  }

  text = text.replace(REFERENCES, '').trim();

  const conventional = CONVENTIONAL.exec(text);
  const type = conventional?.[1];

  if (conventional !== null && type !== undefined && type in KIND_OF_TYPE) {
    kind = KIND_OF_TYPE[type] ?? null;
    scope = conventional[2] ?? null;
    text = conventional[3] ?? '';
  }

  const bold = BOLD_SCOPE.exec(text);

  if (bold !== null) {
    scope = bold[1] ?? null;
    text = bold[2] ?? '';
  }

  text = text
    .replace(LINK, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim();

  return {
    point: {
      text: text.charAt(0).toUpperCase() + text.slice(1),
      scope:
        scope
          ?.split(',')
          .map((part) => part.trim())
          .join(', ') ?? null,
      pull,
      author,
    },
    kind,
  };
};

/**
 * Reads the notes GitHub keeps for a release into sections of plain points, so they can be shown
 * without rendering anything from outside. Sections the notes name keep their names; points with no
 * named section — GitHub's generated "What's Changed" list — are grouped by the kind of change their
 * conventional type says, added, fixed or other. Links to issues and commits and the markup are
 * dropped, the pull request and its author kept apart, and the list of first contributors left out.
 *
 * @param notes - The release's notes, as written.
 * @returns Each section and its points, in order.
 */
const readReleaseNotes = (notes: string): ReleaseSection[] => {
  const written: ReleaseSection[] = [];
  const grouped = new Map<GroupedKind, ReleasePoint[]>();
  let current: ReleaseSection | null = null;

  for (const raw of notes.split('\n')) {
    const line = raw.trim();
    const heading = /^#{3,}\s+(.+)$/.exec(line);

    if (heading !== null) {
      current = {
        kind: 'written',
        heading: (heading[1] ?? '').replace(LINK, '$1').trim(),
        points: [],
      };
      written.push(current);

      continue;
    }

    if (/^#{1,2}\s/.test(line)) {
      current = null;

      continue;
    }

    const bullet = /^[*-]\s+(.+)$/.exec(line);

    if (bullet === null || FIRST_CONTRIBUTION.test(bullet[1] ?? '')) {
      continue;
    }

    const { point, kind } = readPoint(bullet[1] ?? '');

    if (current === null) {
      const into = kind ?? 'other';

      grouped.set(into, [...(grouped.get(into) ?? []), point]);
    } else {
      current.points.push(point);
    }
  }

  return [
    ...written,
    ...GROUPED_ORDER.flatMap((kind): ReleaseSection[] => {
      const points = grouped.get(kind);

      return points === undefined ? [] : [{ kind, points }];
    }),
  ].filter((section) => section.points.length > 0);
};

export type { ReleasePoint, ReleaseSection };

export { readReleaseNotes };
