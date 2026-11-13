import type { LibraryKind } from '@ValenceContracts/schemas/Library';

type DiskShare = {
  id: string;
  label: string;
  bytes: number;
  is: 'library' | 'valence' | 'else' | 'free';
  libraryKind?: LibraryKind;
};

/**
 * Divides a disk between what is on it: each library on it, largest first, then the files Valence
 * keeps for itself where they are on it, then whatever else the disk holds, then the room left. What
 * is not a library or Valence's is what remains of the used space once those are taken off, so the
 * shares always add up to the disk. Where the libraries are counted as holding more than the disk has used, as a library
 * reaching onto another disk would be, they are scaled down together to fit.
 *
 * @param disk - How big the disk is and how much of it is free.
 * @param libraries - The libraries on it, each with how much it holds.
 * @param valenceBytes - How much Valence keeps on it for itself, or null where its files are on
 * another disk, which leaves them out.
 * @param names - What to call Valence's files, everything else, and the room left.
 * @returns The shares, in the order they are drawn.
 */
const diskShares = (
  disk: { totalBytes: number; availableBytes: number },
  libraries: readonly {
    id: string;
    name: string;
    kind: LibraryKind;
    sizeBytes?: number | null | undefined;
  }[],
  valenceBytes: number | null,
  names: { valence: string; else: string; free: string },
): DiskShare[] => {
  const used = Math.max(0, disk.totalBytes - disk.availableBytes);
  const held = [...libraries]
    .map((library) => ({
      id: library.id,
      label: library.name,
      bytes: library.sizeBytes ?? 0,
      is: 'library' as const,
      libraryKind: library.kind,
    }))
    .filter((share) => share.bytes > 0)
    .sort((one, other) => other.bytes - one.bytes);
  const counted = held.reduce((sum, share) => sum + share.bytes, 0);
  const fits = counted > used && counted > 0 ? used / counted : 1;
  const fitted = held.map((share) => ({ ...share, bytes: share.bytes * fits }));
  const inLibraries = counted * fits;
  const valence = Math.min(valenceBytes ?? 0, Math.max(0, used - inLibraries));
  const rest = Math.max(0, used - inLibraries - valence);

  return [
    ...fitted,
    ...(valenceBytes === null
      ? []
      : [{ id: 'valence', label: names.valence, bytes: valence, is: 'valence' as const }]),
    { id: 'else', label: names.else, bytes: rest, is: 'else' as const },
    { id: 'free', label: names.free, bytes: disk.availableBytes, is: 'free' as const },
  ];
};

export type { DiskShare };

export { diskShares };
