import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { whereTheDecodersAre } from './whereTheDecodersAre';

const REPOSITORY = join('/', 'work', 'Valence');

const APP = join(REPOSITORY, 'apps', 'desktop');

describe('whereTheDecodersAre', () => {
  it('finds the decoders where Cargo builds the workspace, and ships them where the player asks', () => {
    expect(whereTheDecodersAre(REPOSITORY, APP)).toStrictEqual({
      built: join(
        REPOSITORY,
        'target',
        'wasm32-unknown-unknown',
        'release',
        'valence_browser_decoders.wasm',
      ),
      shipped: join(APP, 'public', 'decoders', 'valence-browser-decoders.wasm'),
    });
  });

  it('follows Cargo to a target folder it was told to build in', () => {
    expect(whereTheDecodersAre(REPOSITORY, APP, join('/', 'cache', 'target')).built).toBe(
      join(
        '/',
        'cache',
        'target',
        'wasm32-unknown-unknown',
        'release',
        'valence_browser_decoders.wasm',
      ),
    );
    expect(whereTheDecodersAre(REPOSITORY, APP, 'elsewhere').built).toBe(
      join(
        REPOSITORY,
        'elsewhere',
        'wasm32-unknown-unknown',
        'release',
        'valence_browser_decoders.wasm',
      ),
    );
    expect(whereTheDecodersAre(REPOSITORY, APP, '').built).toBe(
      join(
        REPOSITORY,
        'target',
        'wasm32-unknown-unknown',
        'release',
        'valence_browser_decoders.wasm',
      ),
    );
  });
});
