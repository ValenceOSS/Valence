import { describe, expect, it } from 'vitest';
import { aProfile } from './aProfile';

describe('aProfile', () => {
  it('makes a video profile with what was changed', () => {
    expect(aProfile({ isUpgrading: true })).toMatchObject({ kind: 'video', isUpgrading: true });
  });
});
