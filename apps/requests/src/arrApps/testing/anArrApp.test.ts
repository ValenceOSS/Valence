import { describe, expect, it } from 'vitest';
import { anArrApp } from './anArrApp';

describe('anArrApp', () => {
  it('makes a switched-on Radarr, with what was changed', () => {
    expect(anArrApp({ name: 'Mine' })).toMatchObject({
      kind: 'radarr',
      isEnabled: true,
      name: 'Mine',
    });
  });
});
