import type { TELEMETRY_INSTALL_METHODS } from '@ValenceContracts/schemas/TelemetryReport';

const CONTAINER_MARKERS = ['/.dockerenv', '/run/.containerenv'];

const CONTAINER_WORDS = ['docker', 'containerd', 'kubepods', 'libpod'];

type InstallSurroundings = {
  exists: (path: string) => boolean;
  readFile: (path: string) => string;
  nodeEnv: string;
};

/**
 * Says how this server was installed: in a container when the marker a container leaves at the root
 * is there or the first process belongs to one, as the media service tells them apart, on the
 * machine itself when it runs a production build outside one, and otherwise from a source checkout.
 *
 * @param surroundings - How to look at the filesystem, and which build this is.
 * @returns How it was installed.
 */
const detectInstallMethod = ({
  exists,
  readFile,
  nodeEnv,
}: InstallSurroundings): (typeof TELEMETRY_INSTALL_METHODS)[number] => {
  const cgroup = (() => {
    try {
      return readFile('/proc/1/cgroup');
    } catch {
      return '';
    }
  })();

  if (
    CONTAINER_MARKERS.some((path) => exists(path)) ||
    CONTAINER_WORDS.some((word) => cgroup.includes(word))
  ) {
    return 'docker';
  }

  return nodeEnv === 'production' ? 'native' : 'other';
};

export type { InstallSurroundings };

export { detectInstallMethod };
