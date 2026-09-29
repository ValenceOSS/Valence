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
    expect(whereTheNativeModuleIs('/Applications/Valence.app/Contents/Resources/app.asar')).toBe(
      '/Applications/Valence.app/Contents/Resources/app.asar.unpacked/dist-native/valence.node',
    );
  });

  it('reads it from the app itself out of one', () => {
    expect(whereTheNativeModuleIs('/work/apps/desktop')).toBe(
      '/work/apps/desktop/dist-native/valence.node',
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
    expect(loadIt).toHaveBeenCalledWith('/app/dist-native/valence.node');
  });
});
