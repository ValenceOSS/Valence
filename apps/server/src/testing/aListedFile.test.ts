import { describe, expect, it } from 'vitest';
import { aListedFile } from './aListedFile';

describe('aListedFile', () => {
  it('is a matched 1080p film unless told otherwise', () => {
    expect(aListedFile('heat')).toMatchObject({
      summary: { id: 'heat', height: 1080, externalId: '603' },
      path: '/lib/heat.mkv',
    });
  });

  it('takes changes to the file and to its summary', () => {
    expect(aListedFile('heat', { sizeBytes: 5, summary: { title: 'Heat' } })).toMatchObject({
      sizeBytes: 5,
      summary: { title: 'Heat', id: 'heat' },
    });
  });
});
