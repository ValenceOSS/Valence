import { describe, expect, it } from 'vitest';
import catalogue from 'virtual:ui-catalogue';
import { UI_EXAMPLE_GROUPS } from './UI_EXAMPLE_GROUPS';

const EXAMPLED = new Set(UI_EXAMPLE_GROUPS.flatMap((group) => Object.keys(group.examples)));

describe('UI_EXAMPLE_GROUPS', () => {
  it('has an example of every component in the UI library, so none is left off the page', () => {
    expect(catalogue.map((doc) => doc.name).filter((name) => !EXAMPLED.has(name))).toEqual([]);
  });

  it('has no example of a component the UI library no longer has', () => {
    const named = new Set(catalogue.map((doc) => doc.name));

    expect([...EXAMPLED].filter((name) => !named.has(name))).toEqual([]);
  });

  it('puts each component in one group only', () => {
    const counted = UI_EXAMPLE_GROUPS.flatMap((group) => Object.keys(group.examples));

    expect(counted).toHaveLength(EXAMPLED.size);
  });
});
