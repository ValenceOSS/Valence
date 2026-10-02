import { describe, expect, it } from 'vitest';
import { ARR_IMPORT_SOURCE_KINDS } from '@ValenceContracts/schemas/ArrImport';
import { ARR_IMPORT_SOURCE_NAMES } from './ARR_IMPORT_SOURCE_NAMES';

describe('ARR_IMPORT_SOURCE_NAMES', () => {
  it('names every kind of app a setup is brought in from', () => {
    expect(ARR_IMPORT_SOURCE_KINDS.map((kind) => ARR_IMPORT_SOURCE_NAMES[kind])).toEqual([
      'Radarr',
      'Sonarr',
      'Lidarr',
      'Prowlarr',
      'Overseerr',
      'Jellyseerr',
    ]);
  });
});
