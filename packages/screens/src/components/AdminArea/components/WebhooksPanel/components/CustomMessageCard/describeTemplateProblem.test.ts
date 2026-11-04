import { describe, expect, it } from 'vitest';
import { describeTemplateProblem } from './describeTemplateProblem';

describe('describeTemplateProblem', () => {
  it('says where JSON that cannot be read goes wrong, where that is known', () => {
    expect(describeTemplateProblem({ kind: 'notJson', line: 3, column: 7 })).toBe(
      'This isn’t valid JSON: line 3, column 7.',
    );
  });

  it('says only that it is not JSON where the place is not known', () => {
    expect(describeTemplateProblem({ kind: 'notJson', line: null, column: null })).toBe(
      'This isn’t valid JSON.',
    );
  });

  it('says a form body has to be an object of fields', () => {
    expect(describeTemplateProblem({ kind: 'formNotAnObject' })).toBe(
      'A form body has to be a JSON object of fields.',
    );
  });
});
