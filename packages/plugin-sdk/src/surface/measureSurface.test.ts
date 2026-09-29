import { describe, expect, it } from 'vitest';
import { measureSurface } from './measureSurface';

describe('measureSurface', () => {
  it('counts nothing for an empty surface', () => {
    expect(measureSurface([])).toEqual({ blocks: 0, depth: 0 });
  });

  it('counts rows in a list and blocks inside sections, and how deep sections go', () => {
    expect(
      measureSurface([
        { type: 'heading', text: 'Top' },
        {
          type: 'list',
          rows: [
            { type: 'row', label: 'a' },
            { type: 'row', label: 'b' },
          ],
        },
        { type: 'section', children: [{ type: 'section', children: [{ type: 'divider' }] }] },
      ]),
    ).toEqual({ blocks: 7, depth: 3 });
  });
});
