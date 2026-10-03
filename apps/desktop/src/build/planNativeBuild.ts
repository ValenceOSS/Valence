const CRATE = 'valence-desktop-native';

type NativeBuild = { kind: 'none' } | { kind: 'build'; args: string[]; library: string };

/**
 * Chooses how to build the desktop app's native module for this machine, or says there is nothing to
 * build.
 *
 * Only Windows has one: a Mac and Linux sign in with a passkey in the browser, which needs no system
 * call of ours, while Windows is asked for one directly.
 *
 * @param platform - Which operating system this is.
 * @returns What to run, and where the library it builds ends up.
 */
const planNativeBuild = (platform: string): NativeBuild =>
  platform === 'win32'
    ? {
        kind: 'build',
        args: ['build', '--release', '-p', CRATE],
        library: 'target/release/valence_desktop_native.dll',
      }
    : { kind: 'none' };

export type { NativeBuild };

export { planNativeBuild };
