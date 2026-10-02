import { describe, expect, it } from 'vitest';
import { tidyPath } from './tidyPath';

describe('tidyPath', () => {
  it('writes forward slashes and drops the last one', () => {
    expect(tidyPath('D:\\Media\\Movies\\')).toBe('D:/Media/Movies');
    expect(tidyPath('/data/movies/')).toBe('/data/movies');
  });
});
