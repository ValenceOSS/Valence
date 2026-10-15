/**
 * The arguments that mount a bucket as a folder, tuned for films rather than documents: whole files
 * are cached on disk as they are read so a seek back costs nothing, reads run well ahead of the
 * player, and what is written is sent on a few seconds later rather than held until the end.
 *
 * @param remote - The bucket, as rclone addresses it.
 * @param target - The folder to mount it on.
 * @param cacheDirectory - Where rclone keeps what it has read and what it has yet to send.
 * @returns The arguments.
 */
const mountArguments = (remote: string, target: string, cacheDirectory: string): string[] => [
  'mount',
  remote,
  target,
  '--vfs-cache-mode',
  'full',
  '--cache-dir',
  cacheDirectory,
  '--vfs-cache-max-size',
  '20G',
  '--vfs-read-ahead',
  '256M',
  '--vfs-write-back',
  '5s',
  '--dir-cache-time',
  '5m',
  '--allow-other',
  '--umask',
  '000',
  '--log-level',
  'NOTICE',
];

export { mountArguments };
