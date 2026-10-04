import { describe, expect, it } from 'vitest';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { serviceNotice } from './serviceNotice';

describe('serviceNotice', () => {
  it('is a surface every client can draw', () => {
    expect(SurfaceSchema.parse(serviceNotice('Counter isn’t responding', 'Try again.'))).toEqual({
      blocks: [
        { type: 'notice', tone: 'warning', title: 'Counter isn’t responding', text: 'Try again.' },
      ],
    });
  });
});
