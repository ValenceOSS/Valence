import { describe, expect, it } from 'vitest';
import { templateProblemKey } from './templateProblemKey';

describe('templateProblemKey', () => {
  it('names the string for each problem', () => {
    expect(templateProblemKey({ kind: 'notJson', line: 2, column: 3 })).toBe(
      'error.webhook.theMessageTemplateIsNotValidJson',
    );
    expect(templateProblemKey({ kind: 'formNotAnObject' })).toBe(
      'error.webhook.aFormTemplateIsAnObjectOfFields',
    );
  });
});
