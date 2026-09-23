type ProcessLike = {
  getuid?: () => number;
  setgroups?: (groups: number[]) => void;
  setgid?: (id: number) => void;
  setuid?: (id: number) => void;
  env: Record<string, string | undefined>;
};

type Becoming = 'became' | 'stayedRoot' | 'alreadyNotRoot';

/**
 * Stops being root before the service does anything else, so that the files it puts in a library
 * belong to the user and group asked for, and so that the browser it opens on indexers' pages has
 * no more power than they do. A user id of 0 keeps root on purpose; a service already started as
 * somebody else, by Compose's `user:` or outside a container, is left as it is.
 *
 * @param ids - The user and group to become.
 * @param running - The process.
 * @returns What happened.
 */
const becomeTheUser = (
  { uid, gid }: { uid: number; gid: number },
  running: ProcessLike = process,
): Becoming => {
  const { getuid, setgroups, setgid, setuid } = running;

  if (
    getuid === undefined ||
    setgroups === undefined ||
    setgid === undefined ||
    setuid === undefined ||
    getuid() !== 0
  ) {
    return 'alreadyNotRoot';
  }

  if (uid === 0) {
    return 'stayedRoot';
  }

  setgroups([gid]);
  setgid(gid);
  setuid(uid);
  running.env.HOME = '/tmp';

  return 'became';
};

export { becomeTheUser };
