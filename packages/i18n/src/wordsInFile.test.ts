import { describe, expect, it } from 'vitest';
import { wordsInFile } from './wordsInFile';

describe('wordsInFile', () => {
  it('keeps each handler’s words and leaves the translators’ notes behind', () => {
    expect(
      wordsInFile([{ handler: 'common.cancel', text: 'Abbrechen', context: 'A button.' }]),
    ).toEqual({ 'common.cancel': 'Abbrechen' });
  });
});
