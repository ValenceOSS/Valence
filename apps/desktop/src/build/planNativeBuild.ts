const CRATE = 'valence-desktop-native';

const WINDOWS_TARGETS: Record<string, string> = {
  x64: 'x86_64-pc-windows-msvc',
  arm64: 'aarch64-pc-windows-msvc',
};

type NativeBuild =
  | { kind: 'none' }
  | { kind: 'build'; args: string[]; library: string; module: string };

/**
 * Chooses how to build the desktop app's native module for one processor, or says there is nothing
 * to build.
 *
 * Only Windows has one: a Mac and Linux sign in with a passkey in the browser, which needs no system
 * call of ours, while Windows is asked for one directly. It is built for a named target rather than
 * the machine's own, so an x64 runner builds the ARM64 module too, and the file it ends up as is
 * named for its processor, so the one app holds both and loads its own.
 *
 * @param platform - Which operating system this is.
 * @param arch - Which processor to build for, as Node names it.
 * @returns What to run, where the library it builds ends up, and the name to give it.
 * @throws If Windows is asked for a processor it has no target for.
 */
const planNativeBuild = (platform: string, arch: string): NativeBuild => {
  if (platform !== 'win32') {
    return { kind: 'none' };
  }

  const target = WINDOWS_TARGETS[arch];

  if (target === undefined) {
    throw new Error(`The desktop app's native module is not built for Windows on ${arch}.`);
  }

  return {
    kind: 'build',
    args: ['build', '--release', '-p', CRATE, '--target', target],
    library: `target/${target}/release/valence_desktop_native.dll`,
    module: `valence-${arch}.node`,
  };
};

export type { NativeBuild };

export { planNativeBuild };
