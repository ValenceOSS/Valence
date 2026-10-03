import { describe, expect, it } from 'vitest';
import { A_NEW_WEBHOOK } from './A_NEW_WEBHOOK';
import { paneOfFirstProblem } from './paneOfFirstProblem';

const FILLED = { ...A_NEW_WEBHOOK, name: 'Discord', url: 'https://example.com/hook' };

describe('paneOfFirstProblem', () => {
  it('answers no pane where nothing is wrong', () => {
    expect(paneOfFirstProblem(FILLED)).toBeNull();
  });

  it('points at where to send for a missing name or address', () => {
    expect(paneOfFirstProblem(A_NEW_WEBHOOK)).toBe('where');
    expect(paneOfFirstProblem({ ...FILLED, url: 'example.com' })).toBe('where');
  });

  it('points at the events where it listens for nothing', () => {
    expect(paneOfFirstProblem({ ...FILLED, events: [] })).toBe('events');
  });
});
