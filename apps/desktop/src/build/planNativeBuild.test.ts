import { describe, expect, it } from 'vitest';
import { planNativeBuild } from './planNativeBuild';

describe('planNativeBuild', () => {
  it('builds the DLL on Windows', () => {
    expect(planNativeBuild('win32')).toEqual({
      kind: 'build',
      args: ['build', '--release', '-p', 'valence-desktop-native'],
      library: 'target/release/valence_desktop_native.dll',
    });
  });

  it('builds nothing on a Mac or Linux, which sign in with a passkey in the browser', () => {
    expect(planNativeBuild('darwin')).toEqual({ kind: 'none' });
    expect(planNativeBuild('linux')).toEqual({ kind: 'none' });
  });
});
