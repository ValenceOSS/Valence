import { describe, expect, it, vi } from 'vitest';
import type Module from 'node:module';

const { loadIt } = vi.hoisted(() => ({ loadIt: vi.fn<(path: string) => object>() }));

vi.mock('electron', () => ({ app: { getAppPath: () => '/app' } }));

vi.mock('node:module', async (importOriginal) => {
  const actual = await importOriginal<typeof Module>();

  return {
    ...actual,
    default: { ...actual, createRequire: () => loadIt },
    createRequire: () => loadIt,
  };
});

const { theNativeModule, whereTheNativeModuleIs } = await import('./theNativeModule');

describe('whereTheNativeModuleIs', () => {
  it('reads it from beside the archive in a build, since it cannot be loaded from inside one', () => {
    expect(whereTheNativeModuleIs('/opt/Valence/resources/app.asar', 'x64')).toBe(
      '/opt/Valence/resources/app.asar.unpacked/dist-native/valence-x64.node',
    );
  });

  it('reads it from the app itself out of one', () => {
    expect(whereTheNativeModuleIs('/work/apps/desktop', 'x64')).toBe(
      '/work/apps/desktop/dist-native/valence-x64.node',
    );
  });

  it("reads the module built for this machine's processor, since a Windows build carries both", () => {
    expect(whereTheNativeModuleIs('/opt/Valence/resources/app.asar', 'arm64')).toBe(
      '/opt/Valence/resources/app.asar.unpacked/dist-native/valence-arm64.node',
    );
  });
});

describe('theNativeModule', () => {
  it('offers nothing where the module was never built, and does not go looking again', () => {
    loadIt.mockImplementation(() => {
      throw new Error('Cannot find module');
    });

    expect(theNativeModule()).toEqual({});
    expect(theNativeModule()).toEqual({});
    expect(loadIt).toHaveBeenCalledTimes(1);
    expect(loadIt).toHaveBeenCalledWith(`/app/dist-native/valence-${process.arch}.node`);
  });
});
