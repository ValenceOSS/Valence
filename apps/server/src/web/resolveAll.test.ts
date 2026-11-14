import { describe, expect, it } from 'vitest';
import { resolveAll } from './resolveAll';

describe('resolveAll', () => {
  it('answers a number as itself', async () => {
    await expect(resolveAll('127.0.0.1')).resolves.toEqual(['127.0.0.1']);
  });
});
