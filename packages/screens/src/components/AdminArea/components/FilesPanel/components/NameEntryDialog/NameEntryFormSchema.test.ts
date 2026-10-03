import { describe, expect, it } from 'vitest';
import { NameEntryFormSchema } from './NameEntryFormSchema';

describe('NameEntryFormSchema', () => {
  it('takes a name, trimmed', () => {
    expect(NameEntryFormSchema.parse({ name: ' Arrival (2016).mkv ' })).toEqual({
      name: 'Arrival (2016).mkv',
    });
  });

  it('needs a name', () => {
    expect(NameEntryFormSchema.safeParse({ name: '  ' }).success).toBe(false);
  });
});
