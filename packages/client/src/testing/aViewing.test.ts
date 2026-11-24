import { describe, expect, it } from 'vitest';
import { ViewingSchema } from '@ValenceContracts/schemas/Viewing';
import { aViewing } from './aViewing';

describe('aViewing', () => {
  it('is a viewing a history could answer with', () => {
    expect(ViewingSchema.safeParse(aViewing()).success).toBe(true);
  });

  it('takes the changes a test asks for', () => {
    expect(aViewing({ title: 'Dune' }).title).toBe('Dune');
  });
});
