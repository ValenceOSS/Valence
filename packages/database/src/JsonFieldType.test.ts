import { describe, expectTypeOf, it } from 'vitest';
import type { JsonFieldType } from './JsonFieldType';

describe('JsonFieldType', () => {
  it('names the kinds of value a JSON field can be read as', () => {
    expectTypeOf<JsonFieldType>().toEqualTypeOf<'text' | 'integer' | 'number' | 'boolean'>();
  });
});
