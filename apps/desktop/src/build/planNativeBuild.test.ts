import { describe, expect, it } from 'vitest';
import { planNativeBuild } from './planNativeBuild';

describe('planNativeBuild', () => {
  it('builds the DLL for x64 Windows, named for its processor', () => {
    expect(planNativeBuild('win32', 'x64')).toEqual({
      kind: 'build',
      args: [
        'build',
        '--release',
        '-p',
        'valence-desktop-native',
        '--target',
        'x86_64-pc-windows-msvc',
      ],
      library: 'target/x86_64-pc-windows-msvc/release/valence_desktop_native.dll',
      module: 'valence-x64.node',
    });
  });

  it('builds the DLL for Windows on Arm, beside the x64 one rather than over it', () => {
    expect(planNativeBuild('win32', 'arm64')).toEqual({
      kind: 'build',
      args: [
        'build',
        '--release',
        '-p',
        'valence-desktop-native',
        '--target',
        'aarch64-pc-windows-msvc',
      ],
      library: 'target/aarch64-pc-windows-msvc/release/valence_desktop_native.dll',
      module: 'valence-arm64.node',
    });
  });

  it('refuses a Windows processor it has no target for, rather than shipping without passkeys', () => {
    expect(() => planNativeBuild('win32', 'ia32')).toThrow(/Windows on ia32/u);
  });

  it('builds nothing on a Mac or Linux, which sign in with a passkey in the browser', () => {
    expect(planNativeBuild('darwin', 'arm64')).toEqual({ kind: 'none' });
    expect(planNativeBuild('linux', 'x64')).toEqual({ kind: 'none' });
    expect(planNativeBuild('linux', 'arm64')).toEqual({ kind: 'none' });
  });
});
