import { describe, expect, it } from 'vitest';
import { SaidError } from './SaidError';
import { saying } from './saying';

describe('SaidError', () => {
  it('carries what was said, with its English as the message', () => {
    const error = new SaidError(saying('server.sandbox.thePluginFailed'));

    expect(error.message).toBe('The plugin failed.');
    expect(error.said.code).toBe('server.sandbox.thePluginFailed');
    expect(error).toBeInstanceOf(Error);
  });
});
