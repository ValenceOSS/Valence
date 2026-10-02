import { describe, expect, it } from 'vitest';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { placeholderEmailOf } from './placeholderEmailOf';

describe('placeholderEmailOf', () => {
  it('names the account at the domain that never receives mail', () => {
    expect(placeholderEmailOf('usr-1')).toBe('usr-1@no-email.invalid');
  });

  it('is never taken for a real address', () => {
    expect(realEmailOf(placeholderEmailOf('usr-1'))).toBeNull();
  });
});
