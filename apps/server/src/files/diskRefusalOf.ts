type DiskRefusal =
  { kind: 'missing' } | { kind: 'readOnly' } | { kind: 'denied' } | { kind: 'failed' };

/**
 * What the disk's refusal was, told apart so that the fix for a mount that is read-only, or a folder
 * Valence may not change, can be named rather than lumped in with every other failure.
 *
 * @param error - What the filesystem threw, or nothing where it threw something else.
 * @returns The refusal.
 */
const diskRefusalOf = (error: Error | null): DiskRefusal => {
  const code =
    error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;

  switch (code) {
    case 'ENOENT':
    case 'ENOTDIR':
      return { kind: 'missing' };
    case 'EROFS':
      return { kind: 'readOnly' };
    case 'EACCES':
    case 'EPERM':
      return { kind: 'denied' };
    default:
      return { kind: 'failed' };
  }
};

export type { DiskRefusal };

export { diskRefusalOf };
