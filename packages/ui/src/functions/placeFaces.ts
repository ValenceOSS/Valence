type FaceOnTimeline = {
  id: string;
  atSeconds: number;
};

type PlacedFace = {
  id: string;
  group: string;
  x: number;
  offset: number;
  lift: number;
};

type FaceGroup = {
  key: string;
  x: number;
  reach: number;
  size: number;
};

const FACE_PX = 28;

const OVERLAP_STEP_PX = 18;

const FANNED_STEP_PX = 36;

const TOGETHER_PX = 26;

const LIFT_PX = 10;

const FANNED_LIFT_PX = 14;

/**
 * Where each face sits on a timeline of a given width: people at about the same point gathered
 * around it, and anybody far enough from the rest to have a place of their own lifted a little
 * above the line at it.
 *
 * A gathered group overlaps like circles in a Venn diagram, and the one being pointed at fans
 * outwards and upwards so every face in it can be seen. Faces closer than a face's width would
 * otherwise cover each other completely.
 *
 * Within a group, people who are in sync keep the order they were given in, which for a party is
 * the order they joined, rather than the order of where they are: their positions are reported a
 * second apart and are never exactly equal, so ordering by them swapped faces back and forth on
 * every report. Somebody out of sync takes their place by where they are, behind or ahead, so the
 * order only changes when somebody has actually drifted.
 *
 * Each face's place comes in two parts so they can move differently: where its group is, which
 * follows the reports, and how far it sits from that, which springs open and shut. A group near
 * either end is moved inwards so that, fanned or not, nobody leaves the bar. Each group also says
 * how far either side of its middle it reaches once fanned, which is the area that counts as
 * pointing at it, so it does not change as the faces move.
 *
 * @param people - Who, and where each of them has reached.
 * @param durationSeconds - How long the title is.
 * @param width - How wide the bar is, in pixels.
 * @param fanned - The group spread open, if one is.
 * @param inSyncSeconds - How far apart two people can be and still count as together.
 * @returns Where each face goes, in the order given, and the groups they make.
 */
const placeFaces = (
  people: readonly FaceOnTimeline[],
  durationSeconds: number,
  width: number,
  fanned: string | null = null,
  inSyncSeconds = 0,
): { faces: PlacedFace[]; groups: FaceGroup[] } => {
  const along = (seconds: number) =>
    Math.min(Math.max(seconds / Math.max(durationSeconds, 1), 0), 1) * width;
  const sorted = people
    .map((person, index) => ({
      id: person.id,
      x: along(person.atSeconds),
      atSeconds: person.atSeconds,
      index,
    }))
    .sort((one, other) => one.atSeconds - other.atSeconds);
  const gathered: { id: string; x: number; atSeconds: number; index: number }[][] = [];

  for (const face of sorted) {
    const group = gathered.at(-1);
    const last = group?.at(-1);

    if (group !== undefined && last !== undefined && face.x - last.x < TOGETHER_PX) {
      group.push(face);
    } else {
      gathered.push([face]);
    }
  }

  const placed = new Map<string, PlacedFace>();
  const groups: FaceGroup[] = [];

  for (const found of gathered) {
    const runs: (typeof found)[] = [];

    for (const face of found) {
      const run = runs.at(-1);
      const last = run?.at(-1);

      if (
        run !== undefined &&
        last !== undefined &&
        face.atSeconds - last.atSeconds < inSyncSeconds
      ) {
        run.push(face);
      } else {
        runs.push([face]);
      }
    }

    const group = runs.flatMap((run) => [...run].sort((one, other) => one.index - other.index));
    const key = [...found].sort((one, other) => one.index - other.index)[0]?.id ?? '';
    const isFanned = key === fanned && group.length > 1;
    const step = isFanned ? FANNED_STEP_PX : OVERLAP_STEP_PX;
    const half = ((group.length - 1) * step) / 2;
    const widest = ((group.length - 1) * FANNED_STEP_PX) / 2;
    const middle = group.reduce((sum, face) => sum + face.x, 0) / group.length;
    const x = Math.min(Math.max(middle, widest), Math.max(width - widest, widest));
    const isAlone = group.length === 1 && people.length > 1;
    const lift = isAlone ? LIFT_PX : isFanned ? FANNED_LIFT_PX : 0;

    groups.push({ key, x, reach: widest + FACE_PX / 2, size: group.length });

    group.forEach((face, index) => {
      placed.set(face.id, { id: face.id, group: key, x, offset: index * step - half, lift });
    });
  }

  return {
    faces: people.map(
      (person) =>
        placed.get(person.id) ?? {
          id: person.id,
          group: person.id,
          x: along(person.atSeconds),
          offset: 0,
          lift: 0,
        },
    ),
    groups,
  };
};

export type { FaceGroup, FaceOnTimeline, PlacedFace };

export { placeFaces, FACE_PX, FANNED_LIFT_PX, FANNED_STEP_PX, LIFT_PX, OVERLAP_STEP_PX };
