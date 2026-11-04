import { describe, expect, it } from 'vitest';
import { webhookNameProblem } from './webhookNameProblem';

describe('webhookNameProblem', () => {
  it('takes a name of up to 100 characters', () => {
    expect(webhookNameProblem('Alerts')).toBeNull();
    expect(webhookNameProblem('a'.repeat(100))).toBeNull();
  });

  it('asks for a shorter name past that', () => {
    expect(webhookNameProblem('a'.repeat(101))).toBe('Keep it to 100 characters or fewer.');
  });
});
