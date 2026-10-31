import { describe, expect, it } from 'vitest';
import { problemWith } from './problemWith';

const setting = (kind: 'text' | 'secret' | 'toggle' | 'select' | 'number', more: object = {}) => ({
  id: 'a',
  label: 'Quality',
  kind,
  ...more,
});

describe('problemWith', () => {
  it('takes each kind only as itself', () => {
    expect(problemWith(setting('toggle'), true)).toBeNull();
    expect(problemWith(setting('toggle'), 'yes')?.message).toBe(
      'Quality has the wrong type of value.',
    );
    expect(problemWith(setting('text'), 'words')).toBeNull();
    expect(problemWith(setting('secret'), 3)).not.toBeNull();
    expect(problemWith(setting('text'), 'x'.repeat(4001))?.message).toBe('Quality is too long.');
  });

  it('takes a number only within its limits, and never one that is not finite', () => {
    const limited = setting('number', { min: 1, max: 10 });

    expect(problemWith(limited, 5)).toBeNull();
    expect(problemWith(limited, 0.5)?.message).toBe('Quality is outside the numbers it allows.');
    expect(problemWith(limited, 11)).not.toBeNull();
    expect(problemWith(setting('number'), Number.POSITIVE_INFINITY)).not.toBeNull();
    expect(problemWith(setting('number'), '5')).not.toBeNull();
  });

  it('takes a choice only from its options', () => {
    const choice = setting('select', {
      options: [
        { value: 'high', label: 'High' },
        { value: 'low', label: 'Low' },
      ],
    });

    expect(problemWith(choice, 'low')).toBeNull();
    expect(problemWith(choice, 'medium')?.message).toBe('Quality isn’t one of its choices.');
  });
});
