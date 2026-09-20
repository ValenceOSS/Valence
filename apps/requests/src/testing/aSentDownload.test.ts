import { describe, expect, it } from 'vitest';
import { aDownloadClient } from './aDownloadClient';
import { aSentDownload } from './aSentDownload';

describe('aSentDownload', () => {
  it('makes a download sent to the client aDownloadClient makes, with what was changed', () => {
    expect(aSentDownload({ state: 'done' })).toMatchObject({
      clientId: aDownloadClient().id,
      state: 'done',
    });
  });
});
