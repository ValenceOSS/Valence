const NUMBERED =
  /^(?<name>.*?)(?:(?<=[\])}])|[._ -]+)[([]?(?<kind>cd|dvd|part|pt|dis[ck])[._ -]*(?<number>[0-9]+)[)\]]?(?:\.[^.]+)?$/iu;

const LETTERED =
  /^(?<name>.*?)(?:(?<=[\])}])|[._ -]+)[([]?(?<kind>cd|dvd|part|pt|dis[ck])[._ -]*(?<letter>[a-d])[)\]]?(?:\.[^.]+)?$/iu;

type StackPart = { name: string; kind: string; number: number };

/**
 * Which part of a film kept as several files a file is, by the same two rules Jellyfin stacks
 * files by: a part word — cd, dvd, part, pt, disc or disk — and a number or a letter from a to d,
 * at the very end of its name, so "Film (1999) - cd2.mkv" is the second part of "Film (1999)" and
 * "A Saga Part 1 (2010).mkv", whose part word is not at the end, is no part of anything.
 *
 * @param fileName - The file's name, with or without its extension.
 * @returns What it is a part of, by which word, and which part, or null.
 */
const readStackPart = (fileName: string): StackPart | null => {
  const numbered = NUMBERED.exec(fileName)?.groups;

  if (
    numbered?.name !== undefined &&
    numbered.kind !== undefined &&
    numbered.number !== undefined
  ) {
    return {
      name: numbered.name,
      kind: numbered.kind.toLowerCase(),
      number: Number(numbered.number),
    };
  }

  const lettered = LETTERED.exec(fileName)?.groups;

  if (
    lettered?.name !== undefined &&
    lettered.kind !== undefined &&
    lettered.letter !== undefined
  ) {
    return {
      name: lettered.name,
      kind: lettered.kind.toLowerCase(),
      number: lettered.letter.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1,
    };
  }

  return null;
};

export type { StackPart };

export { readStackPart };
