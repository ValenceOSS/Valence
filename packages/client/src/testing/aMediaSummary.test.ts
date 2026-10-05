import { describe, expect, it } from 'vitest';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { aMediaSummary } from './aMediaSummary';

describe('aMediaSummary', () => {
  it('is a film the library could answer with', () => {
    expect(MediaSummarySchema.safeParse(aMediaSummary()).success).toBe(true);
  });

  it('takes the changes a test asks for', () => {
    expect(aMediaSummary({ title: 'Dune' }).title).toBe('Dune');
  });
});
