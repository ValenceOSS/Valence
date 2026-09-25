import { afterEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { fromThisDevice } from './fromThisDevice';

afterEach(() => {
  forgetPlatform();
});

describe('fromThisDevice', () => {
  it('names this device in the header the server reads', () => {
    installPlatform(aFakePlatform({ thisClientId: () => 'a-laptop' }));

    expect(fromThisDevice()).toEqual({ 'x-valence-client': 'a-laptop' });
  });
});
