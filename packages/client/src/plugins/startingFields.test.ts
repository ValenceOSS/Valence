import { describe, expect, it } from 'vitest';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { startingFields } from './startingFields';

describe('startingFields', () => {
  it('gathers every field’s starting value, from every section', () => {
    const surface = SurfaceSchema.parse({
      blocks: [
        { type: 'toggle', field: 'sync', label: 'Sync', value: true },
        { type: 'textField', field: 'name', label: 'Name' },
        {
          type: 'section',
          children: [
            {
              type: 'select',
              field: 'list',
              label: 'List',
              value: 'watching',
              options: [{ value: 'watching', label: 'Watching' }],
            },
            { type: 'text', text: 'Not a field' },
          ],
        },
      ],
    });

    expect(startingFields(surface.blocks)).toEqual({ sync: true, name: '', list: 'watching' });
  });

  it('is empty for a page with no fields', () => {
    expect(startingFields([{ type: 'divider' }])).toEqual({});
  });
});
