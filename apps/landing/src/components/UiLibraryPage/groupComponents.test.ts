import { describe, expect, it } from 'vitest';
import { groupComponents } from './groupComponents';
import type { UiComponentDoc } from 'virtual:ui-catalogue';

const doc = (name: string): UiComponentDoc => ({
  name,
  summary: '',
  props: [],
  inherits: [],
  builtOn: [],
});

const COMPONENTS = [doc('Switch'), doc('Button'), doc('Badge'), doc('Orphan')];

const GROUPS = [
  { name: 'Buttons', examples: { Button: [] } },
  { name: 'Inputs', examples: { Switch: [] } },
  { name: 'Feedback', examples: { Badge: [] } },
];

describe('groupComponents', () => {
  it('puts each component in the group its examples live in, in the groups order', () => {
    expect(groupComponents(COMPONENTS, GROUPS).map((group) => group.name)).toEqual([
      'Buttons',
      'Inputs',
      'Feedback',
    ]);
  });

  it('leaves out a component that has no examples yet', () => {
    expect(
      groupComponents(COMPONENTS, GROUPS).flatMap((group) =>
        group.components.map((one) => one.name),
      ),
    ).not.toContain('Orphan');
  });

  it('narrows to names matching the query, ignoring case, and drops empty groups', () => {
    expect(groupComponents(COMPONENTS, GROUPS, ' BUT ')).toEqual([
      { name: 'Buttons', components: [doc('Button')] },
    ]);
  });
});
