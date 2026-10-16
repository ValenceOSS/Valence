import { describe, expect, it } from 'vitest';
import { adviceFor } from './adviceFor';

describe('adviceFor', () => {
  it('reads what the server’s own country says a title contains', () => {
    expect(adviceFor({ GB: ['violence'], US: ['language'] }, 'GB')).toEqual(['violence']);
  });

  it('falls back to another country where that one said nothing', () => {
    expect(adviceFor({ US: ['language'] }, 'DE')).toEqual(['language']);
    expect(adviceFor({ BR: ['drugs'] }, 'DE')).toEqual(['drugs']);
  });

  it('says nothing where nothing was kept, or what was kept cannot be read', () => {
    expect(adviceFor(null, 'GB')).toBeNull();
    expect(adviceFor({ GB: ['scary music'] }, 'GB')).toBeNull();
  });
});
