import { describe, expect, it } from 'vitest';
import { SaidSchema } from './SaidSchema';
import { saying } from './saying';
import { sayVerbatim } from './sayVerbatim';

describe('SaidSchema', () => {
  it('reads something said, with something said inside it', () => {
    const said = saying('requests.downloads.clientSaid', {
      name: 'NZBGet',
      said: sayVerbatim('disk full'),
    });

    expect(SaidSchema.parse(JSON.parse(JSON.stringify(said)))).toEqual(said);
  });

  it('refuses a bare string', () => {
    expect(SaidSchema.safeParse('disk full').success).toBe(false);
  });
});
