import { describe, expect, it, vi } from 'vitest';
import { NEW_WORDS } from './NEW_WORDS';
import { tellOfNewWords } from './tellOfNewWords';

describe('tellOfNewWords', () => {
  it('counts the change and tells everything listening', () => {
    const listener = vi.fn();
    const told = NEW_WORDS.told;

    NEW_WORDS.listeners.add(listener);
    tellOfNewWords();
    NEW_WORDS.listeners.delete(listener);

    expect(NEW_WORDS.told).toBe(told + 1);
    expect(listener).toHaveBeenCalledOnce();
  });
});
