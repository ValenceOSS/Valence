import { describe, expect, it } from 'vitest';
import { keepingSharedFiles } from './keepingSharedFiles';

const DOUBLE = '/shows/Show/Season 01/Show - S01E01-E02.mkv';

describe('keepingSharedFiles', () => {
  it('forgets where an episode was where the episode it shared a file with still holds it', () => {
    const first = { id: 'e1', filePath: DOUBLE };
    const second = { id: 'e2', filePath: DOUBLE };

    expect(keepingSharedFiles([first], [first, second])).toEqual([{ id: 'e1', filePath: null }]);
  });

  it('keeps where an episode was where nothing else holds it, so its old file goes', () => {
    const first = { id: 'e1', filePath: '/shows/Show/Season 01/Show - S01E01.mkv' };
    const second = { id: 'e2', filePath: '/shows/Show/Season 01/Show - S01E02.mkv' };

    expect(keepingSharedFiles([first], [first, second])).toEqual([first]);
  });

  it('keeps where both were when both are being filed again together', () => {
    const first = { id: 'e1', filePath: DOUBLE };
    const second = { id: 'e2', filePath: DOUBLE };

    expect(keepingSharedFiles([first, second], [first, second])).toEqual([first, second]);
  });
});
