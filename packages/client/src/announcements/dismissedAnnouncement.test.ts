import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { dismissAnnouncement, readDismissedAnnouncement } from './dismissedAnnouncement';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('dismissedAnnouncement', () => {
  it('has put nothing away on a new device', () => {
    expect(readDismissedAnnouncement()).toBeNull();
  });

  it('remembers the announcement put away last', () => {
    dismissAnnouncement('a');
    dismissAnnouncement('b');

    expect(readDismissedAnnouncement()).toBe('b');
  });
});
