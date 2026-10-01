import { describe, expect, it } from 'vitest';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import { describeArrAppState } from './describeArrAppState';

const APP: ArrApp = {
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Radarr',
  kind: 'radarr',
  url: 'http://radarr:7878',
  hasApiKey: true,
  remotePath: '',
  localPath: '',
  isEnabled: true,
  isWorking: null,
  version: null,
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

describe('describeArrAppState', () => {
  it('says an app is off, or not checked yet', () => {
    expect(describeArrAppState({ ...APP, isEnabled: false })).toMatchObject({ label: 'Off' });
    expect(describeArrAppState(APP)).toMatchObject({ label: 'Not checked', tone: 'quiet' });
  });

  it('says an app is working, at which version where it said', () => {
    expect(describeArrAppState({ ...APP, isWorking: true, version: '5.14' })).toMatchObject({
      tone: 'success',
      detail: 'Version 5.14',
    });
    expect(describeArrAppState({ ...APP, isWorking: true })).toMatchObject({ detail: null });
  });

  it('says why an app is failing, and where the fix is', () => {
    expect(
      describeArrAppState({
        ...APP,
        isWorking: false,
        lastProblem: { code: null, message: 'Radarr refused its API key', values: {} },
        lastProblemCode: 'ArrAppKeyRefused',
      }),
    ).toMatchObject({
      tone: 'danger',
      detail: 'Radarr refused its API key',
      help: 'https://docs.getvalence.app/install/requesting#a-connected-app-refuses-its-key',
    });
    expect(describeArrAppState({ ...APP, isWorking: false })).toMatchObject({
      label: 'Unreachable',
      detail: null,
    });
  });
});
