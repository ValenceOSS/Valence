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
 * keeps for itself, then whatever else the disk holds, then the room left. What is not a library or
 * Valence's is what remains of the used space once those are taken off, so the shares always add up
 * to the disk.
 *
 * @param disk - How big the disk is and how much of it is free.
 * @param libraries - The libraries on it, each with how much it holds.
 * @param valenceBytes - How much Valence keeps on it for itself.
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
  valenceBytes: number,
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
  const inLibraries = held.reduce((sum, share) => sum + share.bytes, 0);
  const valence = Math.min(valenceBytes, Math.max(0, used - inLibraries));
  const rest = Math.max(0, used - inLibraries - valence);

  return [
    ...held,
    { id: 'valence', label: names.valence, bytes: valence, is: 'valence' as const },
    { id: 'else', label: names.else, bytes: rest, is: 'else' as const },
    { id: 'free', label: names.free, bytes: disk.availableBytes, is: 'free' as const },
  ];
};

export type { DiskShare };

export { diskShares };
