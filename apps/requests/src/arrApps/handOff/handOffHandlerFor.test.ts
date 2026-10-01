import { describe, expect, it } from 'vitest';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { handOffHandlerFor } from './handOffHandlerFor';

describe('handOffHandlerFor', () => {
  it('hands requests to Radarr, Sonarr and Lidarr, and none to Prowlarr', () => {
    const caller = createArrCaller(aFakeArr({}).fetch, anArrApp());

    expect(handOffHandlerFor('radarr', caller)).not.toBeNull();
    expect(handOffHandlerFor('sonarr', caller)).not.toBeNull();
    expect(handOffHandlerFor('lidarr', caller)).not.toBeNull();
    expect(handOffHandlerFor('prowlarr', caller)).toBeNull();
  });
});
