import { describe, expect, it } from 'vitest';
import { saidBySandbox } from './saidBySandbox';

describe('saidBySandbox', () => {
  it('passes on what a plugin threw as it threw it', () => {
    expect(saidBySandbox({ kind: 'thrown', text: 'Error: boom' })).toEqual({
      code: null,
      message: 'Error: boom',
      values: {},
    });
  });

  it('says in Valence’s words what a plugin never said itself', () => {
    expect(saidBySandbox({ kind: 'failed' }).message).toBe('The plugin failed.');
    expect(saidBySandbox({ kind: 'neverDefined' }).message).toBe(
      'The plugin didn’t call definePlugin.',
    );
    expect(saidBySandbox({ kind: 'notLoaded' }).message).toBe('The plugin is not loaded.');
  });
});
