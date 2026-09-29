import { afterEach, describe, expect, it } from 'vitest';
import { definePlugin } from './definePlugin';

describe('definePlugin', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'valencePlugin');
  });

  it('hands the definition back and leaves it where the sandbox reads it', () => {
    const definition = { pages: { tracking: { render: () => ({ blocks: [] }) } } };

    expect(definePlugin(definition)).toBe(definition);
    expect(Reflect.get(globalThis, 'valencePlugin')).toBe(definition);
  });
});
