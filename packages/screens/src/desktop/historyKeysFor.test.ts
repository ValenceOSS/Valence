import { describe, expect, it } from 'vitest';
import { historyKeysFor } from './historyKeysFor';

describe('historyKeysFor', () => {
  it('uses command and the brackets on a Mac', () => {
    expect(historyKeysFor('darwin')).toEqual({ back: ['⌘', '['], forward: ['⌘', ']'] });
  });

  it('uses alt and the arrows on Windows and Linux', () => {
    expect(historyKeysFor('win32')).toEqual({ back: ['Alt', '←'], forward: ['Alt', '→'] });
    expect(historyKeysFor('linux').forward).toEqual(['Alt', '→']);
  });
});
