import { describe, expect, it } from 'vitest';
import { aReaderMarks } from './aReaderMarks';

describe('aReaderMarks', () => {
  it('hands over the bookmarks given, a list to show and handlers that have not been called', () => {
    const marks = aReaderMarks();

    expect(marks.here).toEqual([]);
    expect(marks.list).toBe('The bookmarks');
    expect(marks.onMark).not.toHaveBeenCalled();
    expect(marks.onUnmark).not.toHaveBeenCalled();
  });
});
